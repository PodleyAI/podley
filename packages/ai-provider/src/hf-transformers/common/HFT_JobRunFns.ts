/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DocumentQuestionAnsweringSingle,
  type FeatureExtractionPipeline,
  pipeline,
  // @ts-ignore temporary "fix"
  type PretrainedModelOptions,
  QuestionAnsweringPipeline,
  SummarizationPipeline,
  SummarizationSingle,
  TextClassificationOutput,
  TextClassificationPipeline,
  type TextGenerationPipeline,
  TextGenerationSingle,
  TextStreamer,
  TranslationPipeline,
  TranslationSingle,
} from "@sroussey/transformers";
import {
  AiProviderRunFn,
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  TextClassifierTaskExecuteInput,
  TextClassifierTaskExecuteOutput,
  TextEmbeddingTaskExecuteInput,
  TextEmbeddingTaskExecuteOutput,
  TextGenerationTaskExecuteInput,
  TextGenerationTaskExecuteOutput,
  TextLanguageDetectionTaskExecuteInput,
  TextLanguageDetectionTaskExecuteOutput,
  TextQuestionAnswerTaskExecuteInput,
  TextQuestionAnswerTaskExecuteOutput,
  TextRewriterTaskExecuteInput,
  TextRewriterTaskExecuteOutput,
  TextSummaryTaskExecuteInput,
  TextSummaryTaskExecuteOutput,
  TextTranslationTaskExecuteInput,
  TextTranslationTaskExecuteOutput,
  TypedArray,
  UnloadModelTaskExecuteInput,
  UnloadModelTaskExecuteOutput,
} from "@workglow/ai";
import { PermanentJobError } from "@workglow/job-queue";
import { CallbackStatus } from "./HFT_CallbackStatus";
import { HTF_CACHE_NAME } from "./HFT_Constants";
import { HfTransformersOnnxModelRecord } from "./HFT_ModelSchema";

const pipelines = new Map<string, any>();

/**
 * Helper function to get a pipeline for a model
 * @param progressScaleMax - Maximum progress value for download phase (100 for download-only, 10 for download+run)
 */
const getPipeline = async (
  model: HfTransformersOnnxModelRecord,
  onProgress: (progress: number, message?: string, details?: any) => void,
  options: PretrainedModelOptions = {},
  progressScaleMax: number = 10
) => {
  if (pipelines.has(model.model_id)) {
    return pipelines.get(model.model_id);
  }

  // Track file sizes and progress for weighted calculation
  const fileSizes = new Map<string, number>();
  const fileProgress = new Map<string, number>();
  const fileCompleted = new Set<string>();
  const fileFirstSent = new Set<string>();
  const fileLastSent = new Set<string>();
  const fileLastEventTime = new Map<string, number>();
  const pendingProgressByFile = new Map<
    string,
    { progress: number; file: string; fileProgress: number }
  >();
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;
  const THROTTLE_MS = 160;

  // Pre-estimate total download size based on typical model structure:
  // 3 tiny files (~1KB each) + 1 medium file (~20MB) + 0-2 large files (~1GB each if present)
  const estimatedTinyFiles = 3;
  const estimatedMediumFiles = 1;
  const estimatedTinySize = 1024; // 1KB
  const estimatedMediumSize = 20 * 1024 * 1024; // 20MB
  const estimatedLargeSize = 1024 * 1024 * 1024; // 1GB

  // Start with minimum estimate (4 files), add large files dynamically as we discover them
  const baseEstimate =
    estimatedTinyFiles * estimatedTinySize + estimatedMediumFiles * estimatedMediumSize;

  /**
   * Sends a progress event, respecting throttling but always sending first/last per file
   */
  const sendProgress = (
    overallProgress: number,
    file: string,
    fileProgressValue: number,
    isFirst: boolean,
    isLast: boolean
  ): void => {
    const now = Date.now();
    const lastTime = fileLastEventTime.get(file) || 0;
    const timeSinceLastEvent = now - lastTime;
    const shouldThrottle = !isFirst && !isLast && timeSinceLastEvent < THROTTLE_MS;

    if (shouldThrottle) {
      // Store pending progress for this file
      pendingProgressByFile.set(file, {
        progress: overallProgress,
        file,
        fileProgress: fileProgressValue,
      });
      // Schedule sending if not already scheduled
      if (!throttleTimer) {
        const timeRemaining = Math.max(1, THROTTLE_MS - timeSinceLastEvent);
        throttleTimer = setTimeout(() => {
          // Send all pending progress events
          for (const [pendingFile, pending] of pendingProgressByFile.entries()) {
            onProgress(Math.round(pending.progress), "Downloading model", {
              file: pendingFile,
              progress: pending.fileProgress,
            });
            fileLastEventTime.set(pendingFile, Date.now());
          }
          pendingProgressByFile.clear();
          throttleTimer = null;
        }, timeRemaining);
      }
      return;
    }

    // Send immediately
    onProgress(Math.round(overallProgress), "Downloading model", {
      file,
      progress: fileProgressValue,
    });
    fileLastEventTime.set(file, now);
    // Clear any pending progress for this file since we're sending it now
    pendingProgressByFile.delete(file);
    if (throttleTimer && pendingProgressByFile.size === 0) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
  };

  // Track whether we've seen a substantial file (to avoid premature progress reports for tiny config files)
  let hasSeenSubstantialFile = false;
  const substantialFileThreshold = 1024 * 1024; // 1MB - files larger than this are substantial

  // Get the abort signal from options if provided
  const abortSignal = options.abort_signal;

  // Create a callback status object for progress tracking
  const progressCallback = (status: CallbackStatus) => {
    // Check if operation has been aborted before processing progress
    if (abortSignal?.aborted) {
      return; // Don't process progress for aborted operations
    }

    if (status.status === "progress") {
      const file = status.file;
      const fileTotal = status.total;
      const fileProgressValue = status.progress;

      // Track file size on first progress event
      if (!fileSizes.has(file)) {
        fileSizes.set(file, fileTotal);
        fileProgress.set(file, 0);

        // Check if this is a substantial file
        if (fileTotal >= substantialFileThreshold) {
          hasSeenSubstantialFile = true;
        }
      }

      // Update file progress
      fileProgress.set(file, fileProgressValue);

      // Check if file is complete
      const isComplete = fileProgressValue >= 100;
      if (isComplete && !fileCompleted.has(file)) {
        fileCompleted.add(file);
        fileProgress.set(file, 100);
      }

      // Calculate actual loaded bytes and adjust estimated total
      let actualLoadedSize = 0;
      let actualTotalSize = 0;

      // Categorize seen files and track their actual sizes
      const tinyThreshold = 100 * 1024; // 100KB - files smaller are config/vocab
      const mediumThreshold = 100 * 1024 * 1024; // 100MB - tokenizer and small models
      let seenTinyCount = 0;
      let seenMediumCount = 0;
      let seenLargeCount = 0;

      for (const [trackedFile, size] of fileSizes.entries()) {
        actualTotalSize += size;
        const progress = fileProgress.get(trackedFile) || 0;
        actualLoadedSize += (size * progress) / 100;

        // Categorize file
        if (size < tinyThreshold) {
          seenTinyCount++;
        } else if (size < mediumThreshold) {
          seenMediumCount++;
        } else {
          seenLargeCount++;
        }
      }

      // Adjust estimated total size:
      // - Start with actual sizes of seen files
      // - Add estimates for unseen tiny/medium files
      // - For large files: conservatively assume 1 until we've seen all expected files
      const unseenTinyFiles = Math.max(0, estimatedTinyFiles - seenTinyCount);
      const unseenMediumFiles = Math.max(0, estimatedMediumFiles - seenMediumCount);

      // Dynamically estimate large files:
      // - If we've seen a large file, assume up to 2 total
      // - Otherwise, conservatively assume 1 large file might exist to prevent premature 100% progress
      // - This prevents the progress from jumping when a large file appears unexpectedly
      let estimatedLargeFiles: number;
      if (seenLargeCount > 0) {
        estimatedLargeFiles = 2; // We've seen at least one, expect up to 2
      } else {
        estimatedLargeFiles = 1; // Haven't seen any large files yet, but assume 1 might exist
      }
      const unseenLargeFiles = Math.max(0, estimatedLargeFiles - seenLargeCount);

      const adjustedTotalSize =
        actualTotalSize +
        unseenTinyFiles * estimatedTinySize +
        unseenMediumFiles * estimatedMediumSize +
        unseenLargeFiles * estimatedLargeSize;

      // Scale progress to the configured range (0-100 for download-only, 0-10 for download+run)
      const rawProgress = adjustedTotalSize > 0 ? (actualLoadedSize / adjustedTotalSize) * 100 : 0;
      const overallProgress = (rawProgress * progressScaleMax) / 100;

      // Determine if this is first or last event for this file
      const isFirst = !fileFirstSent.has(file);
      const isLast = isComplete && !fileLastSent.has(file);

      if (isFirst) {
        fileFirstSent.add(file);
      }
      if (isLast) {
        fileLastSent.add(file);
      }

      // Only report progress if we've seen a substantial file (to avoid premature 100% for tiny config files)
      if (hasSeenSubstantialFile) {
        sendProgress(overallProgress, file, fileProgressValue, isFirst, isLast);
      }
    } else if (status.status === "done" || status.status === "download") {
      // Handle file completion from bookend events
      const file = status.file;

      // Check if this file should mark the start of substantial downloads
      const fileSize = fileSizes.get(file) || 0;
      if (fileSize >= substantialFileThreshold) {
        hasSeenSubstantialFile = true;
      }

      if (!fileCompleted.has(file)) {
        fileCompleted.add(file);
        fileProgress.set(file, 100);

        // Recalculate overall progress using same logic as progress handler
        let actualLoadedSize = 0;
        let actualTotalSize = 0;

        const tinyThreshold = 100 * 1024; // 100KB - files smaller are config/vocab
        const mediumThreshold = 100 * 1024 * 1024; // 100MB - tokenizer and small models
        let seenTinyCount = 0;
        let seenMediumCount = 0;
        let seenLargeCount = 0;

        for (const [trackedFile, size] of fileSizes.entries()) {
          actualTotalSize += size;
          const progress = fileProgress.get(trackedFile) || 0;
          actualLoadedSize += (size * progress) / 100;

          // Categorize file
          if (size < tinyThreshold) {
            seenTinyCount++;
          } else if (size < mediumThreshold) {
            seenMediumCount++;
          } else {
            seenLargeCount++;
          }
        }

        // Adjust estimated total size (same logic as progress handler)
        const unseenTinyFiles = Math.max(0, estimatedTinyFiles - seenTinyCount);
        const unseenMediumFiles = Math.max(0, estimatedMediumFiles - seenMediumCount);

        // Dynamically estimate large files (same logic as progress handler)
        let estimatedLargeFiles: number;
        if (seenLargeCount > 0) {
          estimatedLargeFiles = 2;
        } else {
          estimatedLargeFiles = 1;
        }
        const unseenLargeFiles = Math.max(0, estimatedLargeFiles - seenLargeCount);

        const adjustedTotalSize =
          actualTotalSize +
          unseenTinyFiles * estimatedTinySize +
          unseenMediumFiles * estimatedMediumSize +
          unseenLargeFiles * estimatedLargeSize;

        // Scale progress to the configured range (0-100 for download-only, 0-10 for download+run)
        const rawProgress =
          adjustedTotalSize > 0 ? (actualLoadedSize / adjustedTotalSize) * 100 : 0;
        const overallProgress = (rawProgress * progressScaleMax) / 100;
        const isLast = !fileLastSent.has(file);
        if (isLast) {
          fileLastSent.add(file);
          // Only report if we've seen a substantial file
          if (hasSeenSubstantialFile) {
            sendProgress(overallProgress, file, 100, false, true);
          }
        }
      }
    }
  };

  const pipelineOptions: PretrainedModelOptions = {
    dtype: model.providerConfig.dType || "q8",
    ...(model.providerConfig.useExternalDataFormat
      ? { use_external_data_format: model.providerConfig.useExternalDataFormat }
      : {}),
    ...(model.providerConfig.device ? { device: model.providerConfig.device as any } : {}),
    ...options,
    progress_callback: progressCallback,
  };

  // Check if already aborted before starting
  if (abortSignal?.aborted) {
    throw new Error("Operation aborted before pipeline creation");
  }

  const pipelineType = model.providerConfig.pipeline;

  // Wrap the pipeline call with abort handling
  // Create a promise that rejects when aborted
  const abortPromise = new Promise<never>((_, reject) => {
    if (abortSignal) {
      const handleAbort = () => {
        reject(new Error("Pipeline download aborted"));
      };

      if (abortSignal.aborted) {
        handleAbort();
      } else {
        abortSignal.addEventListener("abort", handleAbort, { once: true });
      }
    }
  });

  // Race between pipeline creation and abort
  const pipelinePromise = pipeline(pipelineType, model.providerConfig.modelPath, pipelineOptions);

  try {
    const result = await (abortSignal
      ? Promise.race([pipelinePromise, abortPromise])
      : pipelinePromise);

    // Check if aborted after pipeline creation
    if (abortSignal?.aborted) {
      throw new Error("Operation aborted after pipeline creation");
    }

    pipelines.set(model.model_id, result);
    return result;
  } catch (error: any) {
    // If aborted, throw a clean abort error rather than internal stream errors
    if (abortSignal?.aborted) {
      throw new Error("Pipeline download aborted");
    }
    // Otherwise, re-throw the original error
    throw error;
  }
};

/**
 * Core implementation for downloading and caching a Hugging Face Transformers model.
 * This is shared between inline and worker implementations.
 */
export const HFT_Download: AiProviderRunFn<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  // Download the model by creating a pipeline
  // Use 100 as progressScaleMax since this is download-only (0-100%)
  await getPipeline(model!, onProgress, { abort_signal: signal }, 100);

  return {
    model: input.model!,
  };
};

/**
 * Core implementation for unloading a Hugging Face Transformers model.
 * This is shared between inline and worker implementations.
 */
export const HFT_Unload: AiProviderRunFn<
  UnloadModelTaskExecuteInput,
  UnloadModelTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  // Delete the pipeline from the in-memory map
  if (pipelines.has(model!.model_id)) {
    pipelines.delete(model!.model_id);
    onProgress(50, "Pipeline removed from memory");
  }

  // Delete model cache entries
  const modelPath = model!.providerConfig.modelPath;
  await deleteModelCache(modelPath);
  onProgress(100, "Model cache deleted");

  return {
    model: input.model!,
  };
};

/**
 * Deletes all cache entries for a given model path
 * @param modelPath - The model path to delete from cache
 */
const deleteModelCache = async (modelPath: string): Promise<void> => {
  const cache = await caches.open(HTF_CACHE_NAME);
  const keys = await cache.keys();
  const prefix = `/${modelPath}/`;

  // Collect all matching requests first
  const requestsToDelete: Request[] = [];
  for (const request of keys) {
    const url = new URL(request.url);
    if (url.pathname.startsWith(prefix)) {
      requestsToDelete.push(request);
    }
  }

  // Delete all matching requests
  let deletedCount = 0;
  for (const request of requestsToDelete) {
    try {
      const deleted = await cache.delete(request);
      if (deleted) {
        deletedCount++;
      } else {
        // If delete returns false, try with URL string as fallback
        const deletedByUrl = await cache.delete(request.url);
        if (deletedByUrl) {
          deletedCount++;
        }
      }
    } catch (error) {
      console.error(`Failed to delete cache entry: ${request.url}`, error);
    }
  }
};

/**
 * Core implementation for text embedding using Hugging Face Transformers.
 * This is shared between inline and worker implementations.
 */

export const HFT_TextEmbedding: AiProviderRunFn<
  TextEmbeddingTaskExecuteInput,
  TextEmbeddingTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  const generateEmbedding: FeatureExtractionPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });

  // Generate the embedding
  const hfVector = await generateEmbedding(input.text, {
    pooling: "mean",
    normalize: model?.providerConfig.normalize,
    ...(signal ? { abort_signal: signal } : {}),
  });

  // Validate the embedding dimensions
  if (hfVector.size !== model?.providerConfig.nativeDimensions) {
    console.warn(
      `HuggingFace Embedding vector length does not match model dimensions v${hfVector.size} != m${model?.providerConfig.nativeDimensions}`,
      input,
      hfVector
    );
    throw new PermanentJobError(
      `HuggingFace Embedding vector length does not match model dimensions v${hfVector.size} != m${model?.providerConfig.nativeDimensions}`
    );
  }

  return { vector: hfVector.data as TypedArray };
};

export const HFT_TextClassifier: AiProviderRunFn<
  TextClassifierTaskExecuteInput,
  TextClassifierTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  const textClassifier: TextClassificationPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });
  const result = await textClassifier(input.text, {
    top_k: input.maxCategories || undefined,
    ...(signal ? { abort_signal: signal } : {}),
  });

  if (Array.isArray(result[0])) {
    return {
      categories: result[0].map((category) => ({
        label: category.label,
        score: category.score,
      })),
    };
  }

  return {
    categories: (result as TextClassificationOutput).map((category) => ({
      label: category.label,
      score: category.score,
    })),
  };
};

export const HFT_TextLanguageDetection: AiProviderRunFn<
  TextLanguageDetectionTaskExecuteInput,
  TextLanguageDetectionTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  const textClassifier: TextClassificationPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });
  const result = await textClassifier(input.text, {
    top_k: input.maxLanguages || undefined,
    ...(signal ? { abort_signal: signal } : {}),
  });

  if (Array.isArray(result[0])) {
    return {
      languages: result[0].map((category) => ({
        language: category.label,
        score: category.score,
      })),
    };
  }

  return {
    languages: (result as TextClassificationOutput).map((category) => ({
      language: category.label,
      score: category.score,
    })),
  };
};

/**
 * Core implementation for text generation using Hugging Face Transformers.
 * This is shared between inline and worker implementations.
 */
export const HFT_TextGeneration: AiProviderRunFn<
  TextGenerationTaskExecuteInput,
  TextGenerationTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  const generateText: TextGenerationPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });

  const streamer = createTextStreamer(generateText.tokenizer, onProgress, signal);

  let results = await generateText(input.prompt, {
    streamer,
    ...(signal ? { abort_signal: signal } : {}),
  });

  if (!Array.isArray(results)) {
    results = [results];
  }
  let text = (results[0] as TextGenerationSingle)?.generated_text;

  if (Array.isArray(text)) {
    text = text[text.length - 1]?.content;
  }
  return {
    text,
  };
};

/**
 * Core implementation for text translation using Hugging Face Transformers.
 * This is shared between inline and worker implementations.
 */
export const HFT_TextTranslation: AiProviderRunFn<
  TextTranslationTaskExecuteInput,
  TextTranslationTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  const translate: TranslationPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });
  const streamer = createTextStreamer(translate.tokenizer, onProgress);

  const result = await translate(input.text, {
    src_lang: input.source_lang,
    tgt_lang: input.target_lang,
    streamer,
    ...(signal ? { abort_signal: signal } : {}),
  } as any);

  let translatedText: string | string[] = "";
  if (Array.isArray(result)) {
    translatedText = result.map((r) => (r as TranslationSingle)?.translation_text || "");
  } else {
    translatedText = (result as TranslationSingle)?.translation_text || "";
  }

  return {
    text: translatedText,
    target_lang: input.target_lang,
  };
};

/**
 * Core implementation for text rewriting using Hugging Face Transformers.
 * This is shared between inline and worker implementations.
 */
export const HFT_TextRewriter: AiProviderRunFn<
  TextRewriterTaskExecuteInput,
  TextRewriterTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  const generateText: TextGenerationPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });
  const streamer = createTextStreamer(generateText.tokenizer, onProgress);

  // This lib doesn't support this kind of rewriting with a separate prompt vs text
  const promptedText = (input.prompt ? input.prompt + "\n" : "") + input.text;

  let results = await generateText(promptedText, {
    streamer,
    ...(signal ? { abort_signal: signal } : {}),
  });

  if (!Array.isArray(results)) {
    results = [results];
  }

  let text = (results[0] as TextGenerationSingle)?.generated_text;
  if (Array.isArray(text)) {
    text = text[text.length - 1]?.content;
  }

  if (text === promptedText) {
    throw new PermanentJobError("Rewriter failed to generate new text");
  }

  return {
    text,
  };
};

/**
 * Core implementation for text summarization using Hugging Face Transformers.
 * This is shared between inline and worker implementations.
 */
export const HFT_TextSummary: AiProviderRunFn<
  TextSummaryTaskExecuteInput,
  TextSummaryTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  const generateSummary: SummarizationPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });
  const streamer = createTextStreamer(generateSummary.tokenizer, onProgress);

  let result = await generateSummary(input.text, {
    streamer,
    ...(signal ? { abort_signal: signal } : {}),
  } as any);

  let summaryText = "";
  if (Array.isArray(result)) {
    summaryText = (result[0] as SummarizationSingle)?.summary_text || "";
  } else {
    summaryText = (result as SummarizationSingle)?.summary_text || "";
  }

  return {
    text: summaryText,
  };
};

/**
 * Core implementation for question answering using Hugging Face Transformers.
 * This is shared between inline and worker implementations.
 */
export const HFT_TextQuestionAnswer: AiProviderRunFn<
  TextQuestionAnswerTaskExecuteInput,
  TextQuestionAnswerTaskExecuteOutput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  // Get the question answering pipeline
  const generateAnswer: QuestionAnsweringPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });
  const streamer = createTextStreamer(generateAnswer.tokenizer, onProgress);

  const result = await generateAnswer(input.question, input.context, {
    streamer,
    ...(signal ? { abort_signal: signal } : {}),
  } as any);

  let answerText = "";
  if (Array.isArray(result)) {
    answerText = (result[0] as DocumentQuestionAnsweringSingle)?.answer || "";
  } else {
    answerText = (result as DocumentQuestionAnsweringSingle)?.answer || "";
  }

  return {
    text: answerText,
  };
};

/**
 * Create a text streamer for a given tokenizer and update progress function
 * @param tokenizer - The tokenizer to use for the streamer
 * @param updateProgress - The function to call to update the progress
 * @param signal - The signal to use for the streamer for aborting
 * @returns The text streamer
 */
function createTextStreamer(
  tokenizer: any,
  updateProgress: (progress: number, message?: string, details?: any) => void,
  signal?: AbortSignal
) {
  let count = 0;
  return new TextStreamer(tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: (text: string) => {
      count++;
      const result = 100 * (1 - Math.exp(-0.05 * count));
      const progress = Math.round(Math.min(result, 100));
      updateProgress(progress, "Generating", { text, progress });
    },
    ...(signal ? { abort_signal: signal } : {}),
  });
}
