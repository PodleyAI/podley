/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilesetResolver, TextEmbedder } from "@mediapipe/tasks-text";
import type {
  AiProviderRunFn,
  DeReplicateFromSchema,
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  TextEmbeddingInputSchema,
  TextEmbeddingOutputSchema,
} from "@workglow/ai";
import { PermanentJobError } from "@workglow/job-queue";
import { TFMPModelRecord } from "./TFMP_ModelSchema";

const wasm_tasks = new Map<string, TextEmbedder>();

/**
 * Helper function to get a WASM task for a model
 */
const getWasmTask = async (
  model: TFMPModelRecord,
  onProgress: (progress: number, message?: string, details?: any) => void
): Promise<TextEmbedder> => {
  if (wasm_tasks.has(model.model_id)) {
    return wasm_tasks.get(model.model_id)!;
  }

  const textFiles = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm"
  );

  const embedder = await TextEmbedder.createFromOptions(textFiles, {
    baseOptions: {
      modelAssetPath: model.providerConfig.modelPath,
    },
  });

  wasm_tasks.set(model.model_id, embedder);
  return embedder;
};

/**
 * Core implementation for downloading and caching a MediaPipe TFJS model.
 * This is shared between inline and worker implementations.
 */
export const TFMP_Download: AiProviderRunFn<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  TFMPModelRecord
> = async (input, model, onProgress, signal) => {
  // Create and cache a WASM task
  await getWasmTask(model!, onProgress);

  return {
    model: input.model,
  };
};

/**
 * Core implementation for text embedding using MediaPipe TFJS.
 * This is shared between inline and worker implementations.
 */
export const TFMP_TextEmbedding: AiProviderRunFn<
  DeReplicateFromSchema<typeof TextEmbeddingInputSchema>,
  DeReplicateFromSchema<typeof TextEmbeddingOutputSchema>,
  TFMPModelRecord
> = async (input, model, onProgress, signal) => {
  onProgress(0.1, "Model loaded");

  const embedder = await getWasmTask(model!, onProgress);

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

/**
 * Core implementation for unloading a MediaPipe TFJS model.
 * This is shared between inline and worker implementations.
 */
export const TFMP_Unload: AiProviderRunFn<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  TFMPModelRecord
> = async (input, model, onProgress, signal) => {
  // Get and dispose the WASM task if it exists
  if (wasm_tasks.has(model!.model_id)) {
    const wasmTask = wasm_tasks.get(model!.model_id)!;
    wasmTask.close();
    wasm_tasks.delete(model!.model_id);
    onProgress(100, "WASM task disposed and removed from memory");
  } else {
    onProgress(100, "No WASM task found in memory");
  }

  return {
    model: input.model,
  };
};
