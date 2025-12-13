/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { AiJob, AiJobInput, getAiProviderRegistry } from "@workglow/ai";
import { ConcurrencyLimiter, JobQueueClient, JobQueueServer } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";
import { getTaskQueueRegistry, TaskInput, TaskOutput } from "@workglow/task-graph";
import { TENSORFLOW_MEDIAPIPE } from "../common/TFMP_Constants";
import { TFMP_Download, TFMP_TextEmbedding, TFMP_Unload } from "../common/TFMP_JobRunFns";

/**
 * Registers the TensorFlow MediaPipe inline job functions for same-thread execution.
 * If no client is provided, creates a default in-memory queue and registers it.
 *
 * @param client - Optional existing JobQueueClient. If not provided, creates a default in-memory queue.
 */
export async function register_TFMP_InlineJobFns(
  client?: JobQueueClient<AiJobInput<TaskInput>, TaskOutput>
): Promise<void> {
  const aiProviderRegistry = getAiProviderRegistry();

  aiProviderRegistry.registerRunFn<any, any>(
    TENSORFLOW_MEDIAPIPE,
    "DownloadModelTask",
    TFMP_Download as any
  );
  aiProviderRegistry.registerRunFn<any, any>(
    TENSORFLOW_MEDIAPIPE,
    "UnloadModelTask",
    TFMP_Unload as any
  );
  aiProviderRegistry.registerRunFn<any, any>(
    TENSORFLOW_MEDIAPIPE,
    "TextEmbeddingTask",
    TFMP_TextEmbedding as any
  );

  // If no client provided, create a default in-memory queue
  if (!client) {
    const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(
      TENSORFLOW_MEDIAPIPE
    );
    await storage.setupDatabase();

    const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(AiJob, {
      storage,
      queueName: TENSORFLOW_MEDIAPIPE,
      limiter: new ConcurrencyLimiter(1, 100),
    });

    client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
      storage,
      queueName: TENSORFLOW_MEDIAPIPE,
    });

    client.attach(server);

    getTaskQueueRegistry().registerQueue({ server, client, storage });
    await server.start();
  }
}
