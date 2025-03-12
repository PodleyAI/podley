//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  pipeline,
  env,
  type PipelineType,
  type FeatureExtractionPipeline,
  type TextGenerationPipeline,
  type TextGenerationSingle,
  type SummarizationPipeline,
  type SummarizationSingle,
  type QuestionAnsweringPipeline,
  type DocumentQuestionAnsweringSingle,
  type TranslationPipeline,
  type TranslationSingle,
  TextStreamer,
  // @ts-ignore temporary "fix"
  type PretrainedModelOptions,
} from "@sroussey/transformers";
import { ElVector, getGlobalModelRepository } from "@ellmers/ai";
import { PermanentJobError } from "@ellmers/job-queue";
import type {
  DownloadModelTaskInput,
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput,
  TextGenerationTaskInput,
  TextGenerationTaskOutput,
  TextRewriterTaskInput,
  TextRewriterTaskOutput,
  TextQuestionAnswerTaskInput,
  TextQuestionAnswerTaskOutput,
  TextSummaryTaskInput,
  TextSummaryTaskOutput,
  TextTranslationTaskInput,
  TextTranslationTaskOutput,
  Model,
  AiJob,
  AiProviderRunFn,
  DownloadModelTaskOutput,
} from "@ellmers/ai";
import { QUANTIZATION_DATA_TYPES } from "../model/ONNXTransformerJsModel";

// @ts-ignore
const IS_WEBGPU_AVAILABLE = !!globalThis.navigator?.gpu;

env.cacheDir = "./.cache";

interface StatusFileBookends {
  status: "initiate" | "download" | "done";
  name: string;
  file: string;
}

interface StatusFileProgress {
  status: "progress";
  name: string;
  file: string;
  loaded: number;
  progress: number;
  total: number;
}

interface StatusRunReady {
  status: "ready";
  model: string;
  task: string;
}
interface StatusRunUpdate {
  status: "update";
  output: string;
}
interface StatusRunComplete {
  status: "complete";
  output: string[];
}

type StatusFile = StatusFileBookends | StatusFileProgress;
type StatusRun = StatusRunReady | StatusRunUpdate | StatusRunComplete;
export type CallbackStatus = StatusFile | StatusRun;

const pipelines = new Map<string, any>();

/**
 *
 * This is a helper function to get a pipeline for a model and assign a
 * progress callback to the task.
 *
 * @param job - The job that is running the task
 * @param model - The model to get the pipeline for
 * @param options - The options to pass to the pipeline
 */
const getPipeline = async (
  update_progress: (progress: number, message?: string, details?: any) => void,
  model: Model,
  options: PretrainedModelOptions = {}
) => {
  if (!pipelines.has(model.name)) {
    pipelines.set(
      model.name,
      pipeline(model.pipeline as PipelineType, model.url, {
        dtype: (model.quantization as QUANTIZATION_DATA_TYPES) || "q8",
        progress_callback: downloadProgressCallback(update_progress),
        ...(model.use_external_data_format
          ? { use_external_data_format: model.use_external_data_format }
          : {}),
        ...(model.device && IS_WEBGPU_AVAILABLE ? { device: model.device as any } : {}),
        ...options,
      })
    );
  }
  return await pipelines.get(model.name);
};

function downloadProgressCallback(
  update_progress: (progress: number, message?: string, details?: any) => void
) {
  return (status: CallbackStatus) => {
    const progress = status.status === "progress" ? Math.round(status.progress) : 0;
    if (status.status === "progress") {
      update_progress(progress, "Downloading model", { file: status.file, progress });
    }
  };
}

function generateProgressCallback(
  update_progress: (progress: number, message: string, details?: any) => void
) {
  let count = 0;
  return (text: string) => {
    count++;
    const result = 100 * (1 - Math.exp(-0.05 * count));
    update_progress(Math.round(Math.min(result, 100)), "Generating", { text });
  };
}

// ===============================================================================

/**
 * This is a task that downloads and caches an onnx model.
 */

export const HuggingFaceLocal_DownloadRun: AiProviderRunFn<
  DownloadModelTaskInput,
  Pick<DownloadModelTaskOutput, "model" | "dimensions" | "normalize">
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw `Model ${input.model} not found`;
  }
  await getPipeline(update_progress, model, { abort_signal: signal });
  return {
    model: model.name,
    dimensions: model.nativeDimensions || 0,
    normalize: model.normalize,
  };
};

/**
 * This is a task that generates an embedding for a single piece of text
 *
 * Model pipeline must be "feature-extraction"
 */
export const HuggingFaceLocal_EmbeddingRun: AiProviderRunFn<
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw `Model ${input.model} not found`;
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Embedding run aborted");
  }
  const generateEmbedding: FeatureExtractionPipeline = await getPipeline(update_progress, model, {
    abort_signal: signal,
  });
  if (signal?.aborted) {
    throw new PermanentJobError("Embedding run aborted");
  }
  const hfVector = await generateEmbedding(input.text, {
    pooling: "mean",
    normalize: model.normalize,
    ...(signal ? { abort_signal: signal } : {}),
  });

  if (hfVector.size !== model.nativeDimensions) {
    console.warn(
      `HuggingFaceLocal Embedding vector length does not match model dimensions v${hfVector.size} != m${model.nativeDimensions}`,
      input,
      hfVector
    );
    throw `HuggingFaceLocal Embedding vector length does not match model dimensions v${hfVector.size} != m${model.nativeDimensions}`;
  }
  // @ts-ignore
  const vector = new ElVector(hfVector.data, model.normalize ?? true);
  return { vector };
};

/**
 * This generates text from a prompt
 *
 * Model pipeline must be "text-generation" or "text2text-generation"
 */
export const HuggingFaceLocal_TextGenerationRun: AiProviderRunFn<
  TextGenerationTaskInput,
  TextGenerationTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw `Model ${input.model} not found`;
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text generation run aborted");
  }
  const generateText: TextGenerationPipeline = await getPipeline(update_progress, model, {
    abort_signal: signal,
  });
  if (signal?.aborted) {
    throw new PermanentJobError("Text generation run aborted");
  }
  const streamer = new TextStreamer(generateText.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(update_progress),
    ...(signal ? { abort_signal: signal } : {}),
  });

  let results = await generateText(input.prompt, {
    streamer,
  } as any);
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
 * Text translation
 *
 * Model pipeline must be "translation"
 */
export const HuggingFaceLocal_TextTranslationRun: AiProviderRunFn<
  TextTranslationTaskInput,
  Partial<TextTranslationTaskOutput>
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw `Model ${input.model} not found`;
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text translation run aborted");
  }
  const translate: TranslationPipeline = await getPipeline(update_progress, model, {
    abort_signal: signal,
  });
  if (signal?.aborted) {
    throw new PermanentJobError("Text translation run aborted");
  }
  const streamer = new TextStreamer(translate.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(update_progress),
    ...(signal ? { abort_signal: signal } : {}),
  });

  let results = await translate(input.text, {
    src_lang: input.source_lang,
    tgt_lang: input.target_lang,
    streamer,
  } as any);
  if (!Array.isArray(results)) {
    results = [results];
  }
  return {
    text: (results[0] as TranslationSingle)?.translation_text,
    target_lang: input.target_lang,
  };
};

/**
 * This is a special case of text generation that takes a prompt and text to rewrite
 *
 * Model pipeline must be "text-generation" or "text2text-generation"
 */
export const HuggingFaceLocal_TextRewriterRun: AiProviderRunFn<
  TextRewriterTaskInput,
  TextRewriterTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw `Model ${input.model} not found`;
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text rewriter run aborted");
  }
  const generateText: TextGenerationPipeline = await getPipeline(update_progress, model, {
    abort_signal: signal,
  });
  if (signal?.aborted) {
    throw new PermanentJobError("Text rewriter run aborted");
  }
  const streamer = new TextStreamer(generateText.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(update_progress),
    ...(signal ? { abort_signal: signal } : {}),
  });

  // This lib doesn't support this kind of rewriting with a separate prompt vs text
  const promptedtext = (input.prompt ? input.prompt + "\n" : "") + input.text;
  let results = await generateText(promptedtext, {
    streamer,
    ...(signal ? { abort_signal: signal } : {}),
  } as any);
  if (!Array.isArray(results)) {
    results = [results];
  }

  let text = (results[0] as TextGenerationSingle)?.generated_text;
  if (Array.isArray(text)) {
    text = text[text.length - 1]?.content;
  }
  if (text == promptedtext) {
    throw "Rewriter failed to generate new text";
  }

  return { text };
};

/**
 * This summarizes a piece of text
 *
 * Model pipeline must be "summarization"
 */

export const HuggingFaceLocal_TextSummaryRun: AiProviderRunFn<
  TextSummaryTaskInput,
  TextSummaryTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw `Model ${input.model} not found`;
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text summary run aborted");
  }
  const generateSummary: SummarizationPipeline = await getPipeline(update_progress, model, {
    abort_signal: signal,
  });
  if (signal?.aborted) {
    throw new PermanentJobError("Text summary run aborted");
  }
  const streamer = new TextStreamer(generateSummary.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(update_progress),
    ...(signal ? { abort_signal: signal } : {}),
  });

  let results = await generateSummary(input.text, {
    streamer,
  } as any);
  if (!Array.isArray(results)) {
    results = [results];
  }
  return {
    text: (results[0] as SummarizationSingle)?.summary_text,
  };
};

/**
 * This is a special case of text generation that takes a context and a question
 *
 * Model pipeline must be "question-answering"
 */
export const HuggingFaceLocal_TextQuestionAnswerRun: AiProviderRunFn<
  TextQuestionAnswerTaskInput,
  TextQuestionAnswerTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw `Model ${input.model} not found`;
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text question answer run aborted");
  }
  const generateAnswer: QuestionAnsweringPipeline = await getPipeline(update_progress, model, {
    abort_signal: signal,
  });
  if (signal?.aborted) {
    throw new PermanentJobError("Text question answer run aborted");
  }
  const streamer = new TextStreamer(generateAnswer.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(update_progress),
    ...(signal ? { abort_signal: signal } : {}),
  });

  let results = await generateAnswer(input.question, input.context, {
    streamer,
  } as any);
  if (!Array.isArray(results)) {
    results = [results];
  }

  return {
    text: (results[0] as DocumentQuestionAnsweringSingle)?.answer,
  };
};
