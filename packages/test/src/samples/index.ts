/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { AiJob, AiJobInput } from "@workglow/ai";
import { TENSORFLOW_MEDIAPIPE } from "@workglow/ai-provider";
import { ConcurrencyLimiter, JobQueueClient, JobQueueServer } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";
import { getTaskQueueRegistry, TaskInput, TaskOutput } from "@workglow/task-graph";
export * from "./MediaPipeModelSamples";
export * from "./ONNXModelSamples";

export async function register_HFT_InMemoryQueue(): Promise<void> {
  const queueName = "HF_TRANSFORMERS_ONNX";
  const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(queueName);
  await storage.setupDatabase();

  const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(
    AiJob<AiJobInput<TaskInput>, TaskOutput>,
    {
      storage,
      queueName,
      limiter: new ConcurrencyLimiter(1, 10),
    }
  );

  const client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
    storage,
    queueName,
  });

  client.attach(server);

  getTaskQueueRegistry().registerQueue({ server, client, storage });
  await server.start();
}

export async function register_TFMP_InMemoryQueue(): Promise<void> {
  const queueName = TENSORFLOW_MEDIAPIPE;
  const storage = new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(queueName);
  await storage.setupDatabase();

  const server = new JobQueueServer<AiJobInput<TaskInput>, TaskOutput>(
    AiJob<AiJobInput<TaskInput>, TaskOutput>,
    {
      storage,
      queueName,
      limiter: new ConcurrencyLimiter(1, 10),
    }
  );

  const client = new JobQueueClient<AiJobInput<TaskInput>, TaskOutput>({
    storage,
    queueName,
  });

  client.attach(server);

  getTaskQueueRegistry().registerQueue({ server, client, storage });
  await server.start();
}
