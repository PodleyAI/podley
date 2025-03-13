//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type {
  AiProviderRunFn,
  DownloadModelTaskInput,
  DownloadModelTaskOutput,
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
import { ElVector, getGlobalModelRepository } from "@ellmers/ai";
import { PermanentJobError } from "@ellmers/job-queue";
import { globalServiceRegistry, WORKER_MANAGER } from "@ellmers/util";
import { ONNX_TRANSFORMERJS } from "../common/HFT_Constants";

// ===============================================================================

/**
 * This is a task that downloads and caches an onnx model.
 */

export const HFT_Client_DownloadRun: AiProviderRunFn<
  DownloadModelTaskInput,
  Pick<DownloadModelTaskOutput, "model" | "dimensions" | "normalize">
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Download run aborted");
  }
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  await workerManager.callWorkerFunction(ONNX_TRANSFORMERJS, "Download", [input, model], {
    signal: signal,
    onProgress: update_progress,
  });
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
export const HFT_Client_EmbeddingRun: AiProviderRunFn<
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Embedding run aborted");
  }
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  const results = await workerManager.callWorkerFunction<any>(
    ONNX_TRANSFORMERJS,
    "TextEmbedding",
    [input, model],
    {
      signal: signal,
      onProgress: update_progress,
    }
  );

  if (results.vector.size !== model.nativeDimensions) {
    console.warn(
      `HuggingFaceLocal Embedding vector length does not match model dimensions v${results.vector.size} != m${model.nativeDimensions}`,
      input,
      results.vector
    );
    throw `HuggingFaceLocal Embedding vector length does not match model dimensions v${results.vector.size} != m${model.nativeDimensions}`;
  }
  return results;
  // const vector = new ElVector(results.vector.data, model.normalize ?? true);
  // return { vector };
};

/**
 * This generates text from a prompt
 *
 * Model pipeline must be "text-generation" or "text2text-generation"
 */
export const HFT_Client_TextGenerationRun: AiProviderRunFn<
  TextGenerationTaskInput,
  TextGenerationTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text generation run aborted");
  }
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  const results = await workerManager.callWorkerFunction<TextGenerationTaskOutput>(
    ONNX_TRANSFORMERJS,
    "TextGeneration",
    [input, model],
    {
      signal: signal,
      onProgress: update_progress,
    }
  );

  return results;
};

/**
 * Text translation
 *
 * Model pipeline must be "translation"
 */
export const HFT_Client_TextTranslationRun: AiProviderRunFn<
  TextTranslationTaskInput,
  Partial<TextTranslationTaskOutput>
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text translation run aborted");
  }
  if (!input.text) debugger;
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  const results = await workerManager.callWorkerFunction<TextTranslationTaskOutput>(
    ONNX_TRANSFORMERJS,
    "TextTranslation",
    [input, model],
    {
      signal: signal,
      onProgress: update_progress,
    }
  );
  results.target_lang = input.target_lang;
  return results;
};

/**
 * This is a special case of text generation that takes a prompt and text to rewrite
 *
 * Model pipeline must be "text-generation" or "text2text-generation"
 */
export const HFT_Client_TextRewriterRun: AiProviderRunFn<
  TextRewriterTaskInput,
  TextRewriterTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text rewriter run aborted");
  }
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  const results = await workerManager.callWorkerFunction<TextRewriterTaskOutput>(
    ONNX_TRANSFORMERJS,
    "TextRewriter",
    [input, model],
    {
      signal: signal,
      onProgress: update_progress,
    }
  );
  if (results.text == input.text) {
    throw "Rewriter failed to generate new text";
  }
  return results;
};

/**
 * This summarizes a piece of text
 *
 * Model pipeline must be "summarization"
 */
export const HFT_Client_TextSummaryRun: AiProviderRunFn<
  TextSummaryTaskInput,
  TextSummaryTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text summary run aborted");
  }
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  const results = await workerManager.callWorkerFunction<TextSummaryTaskOutput>(
    ONNX_TRANSFORMERJS,
    "TextSummary",
    [input, model],
    {
      signal: signal,
      onProgress: update_progress,
    }
  );
  return results;
};

/**
 * This is a special case of text generation that takes a context and a question
 *
 * Model pipeline must be "question-answering"
 */
export const HFT_Client_TextQuestionAnswerRun: AiProviderRunFn<
  TextQuestionAnswerTaskInput,
  TextQuestionAnswerTaskOutput
> = async (update_progress, input, signal?) => {
  const model = await getGlobalModelRepository().findByName(input.model);
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Text question answer run aborted");
  }
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  const results = await workerManager.callWorkerFunction<TextQuestionAnswerTaskOutput>(
    ONNX_TRANSFORMERJS,
    "TextQuestionAnswer",
    [input, model],
    {
      signal: signal,
      onProgress: update_progress,
    }
  );

  return results;
};
