//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { AiJob, AiProviderInput } from "@ellmers/ai";
import { TENSORFLOW_MEDIAPIPE } from "@ellmers/ai-provider";
import { ConcurrencyLimiter, JobQueue } from "@ellmers/job-queue";
import { getTaskQueueRegistry, TaskInput, TaskOutput } from "@ellmers/task-graph";
import { InMemoryQueueStorage } from "@ellmers/storage";
export * from "./MediaPipeModelSamples";
export * from "./ONNXModelSamples";

export async function register_HFT_JobFnsInMemoryQueue() {
  const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
    "HF_TRANSFORMERS_ONNX",
    AiJob<TaskInput, TaskOutput>,
    {
      storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
        "HF_TRANSFORMERS_ONNX"
      ),
      limiter: new ConcurrencyLimiter(1, 10),
    }
  );
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
}

export async function register_TFMP_InMemoryQueue() {
  const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
    TENSORFLOW_MEDIAPIPE,
    AiJob<TaskInput, TaskOutput>,
    {
      storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
        TENSORFLOW_MEDIAPIPE
      ),
      limiter: new ConcurrencyLimiter(1, 10),
    }
  );
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
}
