//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { FilesetResolver, TextEmbedder } from "@mediapipe/tasks-text";
import type {
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  AiProviderRunFn,
  TextEmbeddingOutputSchema,
  TextEmbeddingInputSchema,
} from "@ellmers/ai";
import { PermanentJobError } from "@ellmers/job-queue";
import { DeReplicateStatic } from "@ellmers/task-graph";

/**
 * Core implementation for downloading and caching a MediaPipe TFJS model.
 * This is shared between inline and worker implementations.
 */
export const TFMP_Download: AiProviderRunFn<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput
> = async (input, model, onProgress, signal) => {
  const textFiles = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm"
  );

  // Create an embedder to get dimensions
  const embedder = await TextEmbedder.createFromOptions(textFiles, {
    baseOptions: {
      modelAssetPath: model!.url,
    },
  });

  return {
    model: input.model,
  };
};

/**
 * Core implementation for text embedding using MediaPipe TFJS.
 * This is shared between inline and worker implementations.
 */
export const TFMP_TextEmbedding: AiProviderRunFn<
  DeReplicateStatic<typeof TextEmbeddingInputSchema>,
  DeReplicateStatic<typeof TextEmbeddingOutputSchema>
> = async (input, model, onProgress, signal) => {
  const textFiles = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm"
  );

  onProgress(0.1, "Model loaded");

  const embedder = await TextEmbedder.createFromOptions(textFiles, {
    baseOptions: {
      modelAssetPath: model!.url,
    },
  });

  if (signal.aborted) {
    throw new PermanentJobError("Aborted job");
  }

  onProgress(0.2, "Embedding text");

  const result = embedder.embed(input.text);

  if (!result.embeddings?.[0]?.floatEmbedding) {
    throw new PermanentJobError("Failed to generate embedding: Empty result");
  }

  const embedding = Float32Array.from(result.embeddings[0].floatEmbedding);

  return {
    vector: embedding,
  };
};
