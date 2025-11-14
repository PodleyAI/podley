//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { AiJob, AiJobInput } from "@podley/ai";
import { TENSORFLOW_MEDIAPIPE } from "@podley/ai-provider";
import { ConcurrencyLimiter, JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";
import { getTaskQueueRegistry, TaskInput, TaskOutput } from "@podley/task-graph";
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
