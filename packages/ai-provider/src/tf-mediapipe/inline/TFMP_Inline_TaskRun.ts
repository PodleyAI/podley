//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { FilesetResolver, TextEmbedder } from "@mediapipe/tasks-text";
import {
  DownloadModelTaskInput,
  TextEmbeddingTaskInput,
  getGlobalModelRepository,
  ElVector,
  TextEmbeddingTaskOutput,
} from "@ellmers/ai";
import { PermanentJobError } from "@ellmers/job-queue";

/**
 * This is a task that downloads and caches a MediaPipe TFJS model.
 */
export async function TFMP_Inline_Download(
  update_progress: (progress: number, message?: string, details?: any) => void,
  input: DownloadModelTaskInput,
  signal?: AbortSignal
) {
  const textFiles = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm"
  );
  const model = (await getGlobalModelRepository().findByName(input.model))!;
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  const results = await TextEmbedder.createFromOptions(textFiles, {
    baseOptions: {
      modelAssetPath: model.url!,
    },
    quantize: true,
  });

  return results;
}

/**
 * This is a task that generates an embedding for a single piece of text
 * using a MediaPipe TFJS model.
 */
export async function TFMP_Inline_TextEmbedding(
  update_progress: (progress: number, message?: string, details?: any) => void,
  input: TextEmbeddingTaskInput,
  signal?: AbortSignal
): Promise<TextEmbeddingTaskOutput> {
  const textFiles = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm"
  );
  const model = (await getGlobalModelRepository().findByName(input.model))!;
  if (!model) {
    throw new PermanentJobError(`Model ${input.model} not found`);
  }
  const textEmbedder = await TextEmbedder.createFromOptions(textFiles, {
    baseOptions: {
      modelAssetPath: model.url!,
    },
    quantize: true,
  });

  const output = textEmbedder.embed(input.text);
  const vector = output.embeddings[0].floatEmbedding;

  if (vector?.length !== model.nativeDimensions) {
    throw `MediaPipeTfJsLocal Embedding vector length does not match model dimensions v${vector?.length} != m${model.nativeDimensions}`;
  }
  return { vector: new ElVector(vector!, true) };
}
