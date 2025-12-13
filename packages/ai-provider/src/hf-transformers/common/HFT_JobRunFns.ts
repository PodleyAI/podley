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
  type DeReplicateFromSchema,
  DownloadModelTaskExecuteInput,
  LanguageDetectionInputSchema,
  LanguageDetectionOutputSchema,
  TextClassifierInputSchema,
  TextClassifierOutputSchema,
  TextEmbeddingInputSchema,
  TextEmbeddingOutputSchema,
  TextGenerationInputSchema,
  TextGenerationOutputSchema,
  TextQuestionAnswerInputSchema,
  TextQuestionAnswerOutputSchema,
  TextRewriterInputSchema,
  TextRewriterOutputSchema,
  TextSummaryInputSchema,
  TextSummaryOutputSchema,
  TextTranslationInputSchema,
  TextTranslationOutputSchema,
  TypedArray,
} from "@workglow/ai";
import { PermanentJobError } from "@workglow/job-queue";
import { CallbackStatus } from "./HFT_CallbackStatus";
import { HTF_CACHE_NAME } from "./HFT_Constants";
import { HfTransformersOnnxModelRecord } from "./HFT_ModelSchema";

const pipelines = new Map<string, any>();

/**
 * Helper function to get a pipeline for a model
 */
const getPipeline = async (
  model: HfTransformersOnnxModelRecord,
  onProgress: (progress: number, message?: string, details?: any) => void,
  options: PretrainedModelOptions = {}
) => {
  if (pipelines.has(model.model_id)) {
    return pipelines.get(model.model_id);
  }

  // Create a callback status object for progress tracking
  const progressCallback = (status: CallbackStatus) => {
    const progress = status.status === "progress" ? Math.round(status.progress) : 0;
    if (status.status === "progress") {
      onProgress(progress, "Downloading model", {
        file: status.file,
        progress: status.progress,
      });
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

  const pipelineType = model.providerConfig.pipeline;
  const result = await pipeline(pipelineType, model.providerConfig.modelPath, pipelineOptions);
  pipelines.set(model.model_id, result);
  return result;
};

/**
 * Core implementation for downloading and caching a Hugging Face Transformers model.
 * This is shared between inline and worker implementations.
 */
export const HFT_Download: AiProviderRunFn<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteInput,
  HfTransformersOnnxModelRecord
> = async (input, model, onProgress, signal) => {
  // Download the model by creating a pipeline
  await getPipeline(model!, onProgress, { abort_signal: signal });

  return {
    model: input.model!,
  };
};

/**
 * Core implementation for unloading a Hugging Face Transformers model.
 * This is shared between inline and worker implementations.
 */
export const HFT_Unload: AiProviderRunFn<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteInput,
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
  DeReplicateFromSchema<typeof TextEmbeddingInputSchema>,
  DeReplicateFromSchema<typeof TextEmbeddingOutputSchema>,
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
  DeReplicateFromSchema<typeof TextClassifierInputSchema>,
  DeReplicateFromSchema<typeof TextClassifierOutputSchema>,
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

export const HFT_LanguageDetection: AiProviderRunFn<
  DeReplicateFromSchema<typeof LanguageDetectionInputSchema>,
  DeReplicateFromSchema<typeof LanguageDetectionOutputSchema>,
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
  DeReplicateFromSchema<typeof TextGenerationInputSchema>,
  DeReplicateFromSchema<typeof TextGenerationOutputSchema>,
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
  DeReplicateFromSchema<typeof TextTranslationInputSchema>,
  DeReplicateFromSchema<typeof TextTranslationOutputSchema>,
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
  DeReplicateFromSchema<typeof TextRewriterInputSchema>,
  DeReplicateFromSchema<typeof TextRewriterOutputSchema>,
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
  DeReplicateFromSchema<typeof TextSummaryInputSchema>,
  DeReplicateFromSchema<typeof TextSummaryOutputSchema>,
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
  DeReplicateFromSchema<typeof TextQuestionAnswerInputSchema>,
  DeReplicateFromSchema<typeof TextQuestionAnswerOutputSchema>,
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
