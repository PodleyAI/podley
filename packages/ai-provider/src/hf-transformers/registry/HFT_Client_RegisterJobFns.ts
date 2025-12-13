/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { AiJob, AiJobInput, getAiProviderRegistry } from "@workglow/ai";
import { ConcurrencyLimiter, JobQueueClient, JobQueueServer } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";
import { getTaskQueueRegistry, TaskInput, TaskOutput } from "@workglow/task-graph";
import { globalServiceRegistry, WORKER_MANAGER } from "@workglow/util";
import { HF_TRANSFORMERS_ONNX } from "../common/HFT_Constants";

/**
 * Registers the HuggingFace Transformers client job functions with a web worker.
 * If no client is provided, creates a default in-memory queue and registers it.
 *
 * @param worker - The web worker to use for job execution
 * @param client - Optional existing JobQueueClient. If not provided, creates a default in-memory queue.
 */
export async function register_HFT_ClientJobFns(
  worker: Worker,
  client?: JobQueueClient<AiJobInput<TaskInput>, TaskOutput>
): Promise<void> {
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);

  workerManager.registerWorker(HF_TRANSFORMERS_ONNX, worker);

  const ProviderRegistry = getAiProviderRegistry();
  const names = [
    "DownloadModelTask",
    "UnloadModelTask",
    "TextEmbeddingTask",
    "TextLanguageDetectionTask",
    "TextClassifierTask",
    "TextGenerationTask",
    "TextTranslationTask",
    "TextRewriterTask",
    "TextSummaryTask",
    "TextQuestionAnswerTask",
  ];
  for (const name of names) {
    ProviderRegistry.registerAsWorkerRunFn(HF_TRANSFORMERS_ONNX, name);
  }
  // If no client provided, create a default in-memory queue
  if (!client) {
    const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
      HF_TRANSFORMERS_ONNX
    );

    const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(AiJob, {
      storage,
      queueName: HF_TRANSFORMERS_ONNX,
      limiter: new ConcurrencyLimiter(1, 100),
    });

    client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
      storage,
      queueName: HF_TRANSFORMERS_ONNX,
    });

    client.attach(server);

    getTaskQueueRegistry().registerQueue({ server, client, storage });
    // await server.start();
  }
}
