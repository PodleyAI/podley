//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  LOCAL_ONNX_TRANSFORMERJS,
  registerHuggingfaceLocalTasks,
} from "@ellmers/ai-provider/hf-transformers";
import {
  MEDIA_PIPE_TFJS_MODEL,
  registerMediaPipeTfJsLocalTasks,
} from "@ellmers/ai-provider/tf-mediapipe";
import { TaskInput, TaskOutput, getTaskQueueRegistry } from "@ellmers/task-graph";
import { AiJob, AiProviderInput } from "@ellmers/ai";
import { ConcurrencyLimiter, InMemoryQueueStorage, JobQueue } from "@ellmers/job-queue";
export * from "./sample/MediaPipeModelSamples";
export * from "./sample/ONNXModelSamples";

export async function registerHuggingfaceLocalTasksInMemory() {
  registerHuggingfaceLocalTasks();
  const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
    LOCAL_ONNX_TRANSFORMERJS,
    AiJob<TaskInput, TaskOutput>,
    {
      storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
        LOCAL_ONNX_TRANSFORMERJS
      ),
      limiter: new ConcurrencyLimiter(1, 10),
    }
  );
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
}

export async function registerMediaPipeTfJsLocalInMemory() {
  registerMediaPipeTfJsLocalTasks();
  const jobQueue = new JobQueue<AiProviderInput<TaskInput>, TaskOutput>(
    MEDIA_PIPE_TFJS_MODEL,
    AiJob<TaskInput, TaskOutput>,
    {
      storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(
        MEDIA_PIPE_TFJS_MODEL
      ),
      limiter: new ConcurrencyLimiter(1, 10),
    }
  );
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
}
