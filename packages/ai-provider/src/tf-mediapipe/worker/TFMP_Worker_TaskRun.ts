//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  DownloadModelTaskInput,
  DownloadModelTaskOutput,
  Model,
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput,
} from "@ellmers/ai";
import { FilesetResolver, TextEmbedder } from "@mediapipe/tasks-text";

type WorkerAiFn<I, O> = (
  id: string,
  args: [input: I, model: Model],
  update_progress: (id: string, progress: number, message?: string, detials?: any) => void,
  signal: AbortSignal
) => Promise<Partial<O>>;

import { createServiceToken, WORKER_SERVER } from "@ellmers/util";
import { globalServiceRegistry } from "@ellmers/util";
/**
 * This is a fn that downloads and caches a MediaPipe TFJS model.
 */
export const TFMP_Worker_DownloadRun: WorkerAiFn<
  DownloadModelTaskInput,
  DownloadModelTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  const textFiles = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm"
  );
  await TextEmbedder.createFromOptions(textFiles, {
    baseOptions: {
      modelAssetPath: model.url!,
    },
    quantize: true,
  });

  return { model: model.name, dimensions: model.nativeDimensions || 0, normalize: model.normalize };
};

/**
 * This is a task that generates an embedding for a single piece of text
 * using a MediaPipe TFJS model.
 */
export const TFMP_Worker_TextEmbeddingRun: WorkerAiFn<
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput
> = async (id, [input, model], update_progress, signal) => {
  const textFiles = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm"
  );
  const textEmbedder = await TextEmbedder.createFromOptions(textFiles, {
    baseOptions: {
      modelAssetPath: model.url!,
    },
    quantize: true,
  });

  const output = textEmbedder.embed(input.text);
  const vector = output.embeddings[0].floatEmbedding;

  return { vector } as any;
};

export const TFMP_WORKER_JOBRUN = createServiceToken("worker.ai-provider.tfmp");

export const TFMP_WORKER_JOBRUN_REGISTER = globalServiceRegistry.register(
  TFMP_WORKER_JOBRUN,
  () => {
    const workerServer = globalServiceRegistry.get(WORKER_SERVER);
    workerServer.registerFunction("Download", TFMP_Worker_DownloadRun);
    workerServer.registerFunction("TextEmbedding", TFMP_Worker_TextEmbeddingRun);
    self.postMessage({ type: "ready" });
    console.log("TFMP_WORKER_JOBRUN registered");
    return workerServer;
  },
  true
);
