//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  AiProviderRunFn,
  DownloadModelTaskExecuteInput,
  Model,
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
} from "@ellmers/ai";
import { PermanentJobError } from "@ellmers/job-queue";
import { DeReplicateStatic } from "@ellmers/task-graph";
import {
  DocumentQuestionAnsweringSingle,
  type FeatureExtractionPipeline,
  pipeline,
  type PipelineType,
  // @ts-ignore temporary "fix"
  type PretrainedModelOptions,
  QuestionAnsweringPipeline,
  SummarizationPipeline,
  SummarizationSingle,
  type TextGenerationPipeline,
  TextGenerationSingle,
  TextStreamer,
  TranslationPipeline,
  TranslationSingle,
} from "@sroussey/transformers";
import { CallbackStatus } from "./HFT_CallbackStatus";
import { QUANTIZATION_DATA_TYPES } from "./HFT_Constants";

const pipelines = new Map<string, any>();

/**
 * Helper function to get a pipeline for a model
 */
const getPipeline = async (
  model: Model,
  onProgress: (progress: number, message?: string, details?: any) => void,
  options: PretrainedModelOptions = {}
) => {
  if (pipelines.has(model.name)) {
    return pipelines.get(model.name);
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
    dtype: (model.quantization as QUANTIZATION_DATA_TYPES) || "q8",
    ...(model.use_external_data_format
      ? { use_external_data_format: model.use_external_data_format }
      : {}),
    ...(model.device ? { device: model.device as any } : {}),
    ...options,
    progress_callback: progressCallback,
  };

  const pipelineType = model.pipeline as PipelineType;
  const result = await pipeline(pipelineType, model.url, pipelineOptions);
  pipelines.set(model.name, result);
  return result;
};

/**
 * Core implementation for downloading and caching a Hugging Face Transformers model.
 * This is shared between inline and worker implementations.
 */
export const HFT_Download: AiProviderRunFn<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteInput
> = async (input, model, onProgress, signal) => {
  // Download the model by creating a pipeline
  await getPipeline(model!, onProgress, { abort_signal: signal });

  return {
    model: input.model!,
  };
};

/**
 * Core implementation for text embedding using Hugging Face Transformers.
 * This is shared between inline and worker implementations.
 */
export const HFT_TextEmbedding: AiProviderRunFn<
  DeReplicateStatic<typeof TextEmbeddingInputSchema>,
  DeReplicateStatic<typeof TextEmbeddingOutputSchema>
> = async (input, model, onProgress, signal) => {
  const generateEmbedding: FeatureExtractionPipeline = await getPipeline(model!, onProgress, {
    abort_signal: signal,
  });

  // Generate the embedding
  const hfVector = await generateEmbedding(input.text, {
    pooling: "mean",
    normalize: model!.normalize,
    ...(signal ? { abort_signal: signal } : {}),
  });

  // Validate the embedding dimensions
  if (hfVector.size !== model!.nativeDimensions) {
    console.warn(
      `HuggingFace Embedding vector length does not match model dimensions v${hfVector.size} != m${model!.nativeDimensions}`,
      input,
      hfVector
    );
    throw new PermanentJobError(
      `HuggingFace Embedding vector length does not match model dimensions v${hfVector.size} != m${model!.nativeDimensions}`
    );
  }

  return { vector: hfVector.data as TypedArray };
};

/**
 * Core implementation for text generation using Hugging Face Transformers.
 * This is shared between inline and worker implementations.
 */
export const HFT_TextGeneration: AiProviderRunFn<
  DeReplicateStatic<typeof TextGenerationInputSchema>,
  DeReplicateStatic<typeof TextGenerationOutputSchema>
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
  DeReplicateStatic<typeof TextTranslationInputSchema>,
  DeReplicateStatic<typeof TextTranslationOutputSchema>
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
  DeReplicateStatic<typeof TextRewriterInputSchema>,
  DeReplicateStatic<typeof TextRewriterOutputSchema>
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
  DeReplicateStatic<typeof TextSummaryInputSchema>,
  DeReplicateStatic<typeof TextSummaryOutputSchema>
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
  DeReplicateStatic<typeof TextQuestionAnswerInputSchema>,
  DeReplicateStatic<typeof TextQuestionAnswerOutputSchema>
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
