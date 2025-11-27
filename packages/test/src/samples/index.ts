/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { AiJob, AiJobInput } from "@workglow/ai";
import { TENSORFLOW_MEDIAPIPE } from "@workglow/ai-provider";
import { ConcurrencyLimiter, JobQueue } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";
import { getTaskQueueRegistry, TaskInput, TaskOutput } from "@workglow/task-graph";
export * from "./MediaPipeModelSamples";
export * from "./ONNXModelSamples";

export async function register_HFT_InMemoryQueue() {
  const jobQueue = new JobQueue<AiJobInput<TaskInput>, TaskOutput>(
    "HF_TRANSFORMERS_ONNX",
    AiJob<AiJobInput<TaskInput>, TaskOutput>,
    {
      storage: new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>("HF_TRANSFORMERS_ONNX"),
      limiter: new ConcurrencyLimiter(1, 10),
    }
  );
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
}

export async function register_TFMP_InMemoryQueue() {
  const jobQueue = new JobQueue<AiJobInput<TaskInput>, TaskOutput>(
    TENSORFLOW_MEDIAPIPE,
    AiJob<AiJobInput<TaskInput>, TaskOutput>,
    {
      storage: new InMemoryQueueStorage<AiJobInput<TaskInput>, TaskOutput>(TENSORFLOW_MEDIAPIPE),
      limiter: new ConcurrencyLimiter(1, 10),
    }
  );
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
}
