//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type {
  DownloadModelTaskInput,
  DownloadModelTaskOutput,
  Model,
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput,
  TextGenerationTaskInput,
  TextGenerationTaskOutput,
  TextQuestionAnswerTaskInput,
  TextQuestionAnswerTaskOutput,
  TextRewriterTaskInput,
  TextRewriterTaskOutput,
  TextSummaryTaskInput,
  TextSummaryTaskOutput,
  TextTranslationTaskInput,
  TextTranslationTaskOutput,
} from "@ellmers/ai";
import { ElVector } from "@ellmers/ai";
import { createServiceToken, globalServiceRegistry, WORKER_SERVER } from "@ellmers/util";
import {
  type DocumentQuestionAnsweringSingle,
  type FeatureExtractionPipeline,
  type QuestionAnsweringPipeline,
  type SummarizationPipeline,
  type SummarizationSingle,
  type TextGenerationPipeline,
  type TextGenerationSingle,
  type TranslationPipeline,
  type TranslationSingle,
  type PipelineType,
  pipeline,
  TextStreamer,
} from "@sroussey/transformers";
import { QUANTIZATION_DATA_TYPES } from "../common/HFT_Constants";
import { CallbackStatus } from "../common/HFT_CallbackStatus";

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
  id: string,
  update_progress: (id: string, progress: number, message?: string, details?: any) => void,
  model: Model,
  options: any = {}
) => {
  if (!pipelines.has(model.name)) {
    pipelines.set(
      model.name,
      pipeline(model.pipeline as PipelineType, model.url, {
        dtype: (model.quantization as QUANTIZATION_DATA_TYPES) || "q8",
        progress_callback: downloadProgressCallback(id, update_progress),
        ...(model.use_external_data_format
          ? { use_external_data_format: model.use_external_data_format }
          : {}),
        ...(model.device ? { device: model.device as any } : {}),
        ...options,
      })
    );
  }
  return await pipelines.get(model.name);
};

function downloadProgressCallback(
  id: string,
  update_progress: (id: string, progress: number, message?: string, details?: any) => void
) {
  return (status: CallbackStatus) => {
    const progress = status.status === "progress" ? Math.round(status.progress) : 0;
    if (status.status === "progress") {
      update_progress(id, progress, "Downloading model", { file: status.file, progress });
    }
  };
}

function generateProgressCallback(
  id: string,
  update_progress: (id: string, progress: number, message: string, details?: any) => void
) {
  let count = 0;
  return (text: string) => {
    count++;
    const result = 100 * (1 - Math.exp(-0.05 * count));
    update_progress(id, Math.round(Math.min(result, 100)), "Generating", { text });
  };
}

/**
 * This is a task that downloads and caches an onnx model.
 */

type WorkerAiFn<I, O> = (
  id: string,
  args: [input: I, model: Model],
  update_progress: (id: string, progress: number, message?: string, detials?: any) => void,
  signal: AbortSignal
) => Promise<Partial<O>>;

export const HFTWorker_DownloadRun: WorkerAiFn<
  DownloadModelTaskInput,
  DownloadModelTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  await getPipeline(id, update_progress, model, { abort_signal: signal });
  return { model: model.name, dimensions: model.nativeDimensions || 0, normalize: model.normalize };
};

/**
 * This is a task that generates an embedding for a single piece of text
 *
 * Model pipeline must be "feature-extraction"
 */
export const HFTWorker_EmbeddingRun: WorkerAiFn<
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  const generateEmbedding: FeatureExtractionPipeline = await getPipeline(
    id,
    update_progress,
    model,
    { abort_signal: signal }
  );

  const hfVector = await generateEmbedding(input.text, {
    pooling: "mean",
    normalize: model.normalize,
  });

  if (hfVector.size !== model.nativeDimensions) {
    console.warn(
      `HFTWorker Embedding vector length does not match model dimensions v${hfVector.size} != m${model.nativeDimensions}`,
      input,
      hfVector
    );
    throw `HFTWorker Embedding vector length does not match model dimensions v${hfVector.size} != m${model.nativeDimensions}`;
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
export const HFTWorker_TextGenerationRun: WorkerAiFn<
  TextGenerationTaskInput,
  TextGenerationTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  const generateText: TextGenerationPipeline = await getPipeline(id, update_progress, model, {
    abort_signal: signal,
  });

  const streamer = new TextStreamer(generateText.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(id, update_progress),
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
export const HFTWorker_TextTranslationRun: WorkerAiFn<
  TextTranslationTaskInput,
  TextTranslationTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  const translate: TranslationPipeline = await getPipeline(id, update_progress, model, {
    abort_signal: signal,
  });

  const streamer = new TextStreamer(translate.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(id, update_progress),
  });
  let results;
  try {
    results = await translate(input.text, {
      src_lang: input.source_lang,
      tgt_lang: input.target_lang,
      streamer,
    } as any);
  } catch (e) {
    console.log(
      "HFTWorker_TextTranslationRun AGAIN",
      input.text,
      input.source_lang,
      input.target_lang
    );
    pipelines.delete(model.name);

    const translate: TranslationPipeline = await getPipeline(id, update_progress, model, {
      abort_signal: signal,
    });

    const streamer = new TextStreamer(translate.tokenizer, {
      skip_prompt: true,
      decode_kwargs: { skip_special_tokens: true },
      callback_function: generateProgressCallback(id, update_progress),
    });
    results = await translate(input.text, {
      src_lang: input.source_lang,
      tgt_lang: input.target_lang,
      streamer,
    } as any);
  }
  if (!Array.isArray(results)) {
    results = [results];
  }
  return {
    text: (results[0] as TranslationSingle)?.translation_text,
  };
};

/**
 * This is a special case of text generation that takes a prompt and text to rewrite
 *
 * Model pipeline must be "text-generation" or "text2text-generation"
 */
export const HFTWorker_TextRewriterRun: WorkerAiFn<
  TextRewriterTaskInput,
  TextRewriterTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  const generateText: TextGenerationPipeline = await getPipeline(id, update_progress, model, {
    abort_signal: signal,
  });
  const streamer = new TextStreamer(generateText.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(id, update_progress),
  });

  // This lib doesn't support this kind of rewriting with a separate prompt vs text
  const promptedtext = (input.prompt ? input.prompt + "\n" : "") + input.text;
  let results = await generateText(promptedtext, {
    streamer,
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

export const HFTWorker_TextSummaryRun: WorkerAiFn<
  TextSummaryTaskInput,
  TextSummaryTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  const generateSummary: SummarizationPipeline = await getPipeline(id, update_progress, model, {
    abort_signal: signal,
  });
  const streamer = new TextStreamer(generateSummary.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(id, update_progress),
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
export const HFTWorker_TextQuestionAnswerRun: WorkerAiFn<
  TextQuestionAnswerTaskInput,
  TextQuestionAnswerTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  const generateAnswer: QuestionAnsweringPipeline = await getPipeline(id, update_progress, model, {
    abort_signal: signal,
  });
  const streamer = new TextStreamer(generateAnswer.tokenizer, {
    skip_prompt: true,
    decode_kwargs: { skip_special_tokens: true },
    callback_function: generateProgressCallback(id, update_progress),
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

export const HFT_WORKER_JOBRUN = createServiceToken("worker.ai-provider.hft");

export const HFT_WORKER_JOBRUN_REGISTER = globalServiceRegistry.register(
  HFT_WORKER_JOBRUN,
  () => {
    const workerServer = globalServiceRegistry.get(WORKER_SERVER);
    workerServer.registerFunction("Download", HFTWorker_DownloadRun);
    workerServer.registerFunction("TextEmbedding", HFTWorker_EmbeddingRun);
    workerServer.registerFunction("TextGeneration", HFTWorker_TextGenerationRun);
    workerServer.registerFunction("TextTranslation", HFTWorker_TextTranslationRun);
    workerServer.registerFunction("TextRewriter", HFTWorker_TextRewriterRun);
    workerServer.registerFunction("TextSummary", HFTWorker_TextSummaryRun);
    workerServer.registerFunction("TextQuestionAnswer", HFTWorker_TextQuestionAnswerRun);
    self.postMessage({ type: "ready" });
    console.log("HFT_WORKER_JOBRUN registered");
    return workerServer;
  },
  true
);
