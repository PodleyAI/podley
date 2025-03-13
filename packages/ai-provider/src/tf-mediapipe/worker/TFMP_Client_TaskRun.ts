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
} from "@ellmers/ai";
import { getGlobalModelRepository } from "@ellmers/ai";
import { PermanentJobError } from "@ellmers/job-queue";
import { globalServiceRegistry, WORKER_MANAGER } from "@ellmers/util";
import { MEDIA_PIPE_TFJS_MODEL } from "../common/TFMP_Constants";

// ===============================================================================

/**
 * This is a task that downloads and caches a MediaPipe TFJS model.
 */
export const TFMP_Client_Download: AiProviderRunFn<
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
  await workerManager.callWorkerFunction(MEDIA_PIPE_TFJS_MODEL, "Download", [input, model], {
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
 * using a MediaPipe TFJS model.
 */
export const TFMP_Client_TextEmbedding: AiProviderRunFn<
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput
> = async (update_progress, input, signal?) => {
  const model = (await getGlobalModelRepository().findByName(input.model))!;
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  if (signal?.aborted) {
    throw new PermanentJobError("Embedding run aborted");
  }
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  const results = await workerManager.callWorkerFunction<any>(
    MEDIA_PIPE_TFJS_MODEL,
    "TextEmbedding",
    [input, model],
    {
      signal: signal,
      onProgress: update_progress,
    }
  );
  // @ts-ignore
  if (results.vector.size !== model.nativeDimensions) {
    // @ts-ignore
    throw `MediaPipeTfJsLocal Embedding vector length does not match model dimensions v${results.vector.size} != m${model.nativeDimensions}`;
  }
  return results;
};
