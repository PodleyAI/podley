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
import {
  ConcurrencyLimiter,
  IndexedDbQueueStorage,
  InMemoryQueueStorage,
  InMemoryRateLimiter,
  Job,
  JobConstructorParam,
  JobQueue,
  JobQueueOptions,
  PostgresQueueStorage,
  PostgresRateLimiter,
  SqliteQueueStorage,
  SqliteRateLimiter,
} from "@ellmers/job-queue";
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

export class SqliteJobQueue<I, O, C extends Job<I, O>> extends JobQueue<I, O, C> {
  constructor(
    db: any,
    queueName: string,
    jobCls: new (param: JobConstructorParam<I, O>) => C,
    options: JobQueueOptions<I, O>
  ) {
    options.storage = new SqliteQueueStorage<I, O>(db, queueName);
    super(queueName, jobCls, options);
  }
}

export class InMemoryJobQueue<I, O, C extends Job<I, O>> extends JobQueue<I, O, C> {
  constructor(
    queueName: string,
    jobCls: new (param: JobConstructorParam<I, O>) => C,
    options: JobQueueOptions<I, O>
  ) {
    options.storage = new InMemoryQueueStorage<I, O>(queueName);
    super(queueName, jobCls, options);
  }
}

export class IndexedDbJobQueue<I, O, C extends Job<I, O>> extends JobQueue<I, O, C> {
  constructor(
    queueName: string,
    jobCls: new (param: JobConstructorParam<I, O>) => C,
    options: JobQueueOptions<I, O>
  ) {
    options.storage = new IndexedDbQueueStorage<I, O>(queueName);
    super(queueName, jobCls, options);
  }
}

export class PostgresJobQueue<I, O, C extends Job<I, O>> extends JobQueue<I, O, C> {
  constructor(
    db: any,
    queueName: string,
    jobCls: new (param: JobConstructorParam<I, O>) => C,
    options: JobQueueOptions<I, O>
  ) {
    options.storage = new PostgresQueueStorage<I, O>(db, queueName);
    super(queueName, jobCls, options);
  }
}

interface SimpleJobQueueOptions {
  rateLimiterMaxExecutions?: number;
  rateLimiterWindowSizeInMinutes?: number;
  waitDurationInMilliseconds?: number;
  deleteAfterCompletionMs?: number;
  deleteAfterFailureMs?: number;
}

const defaultSimpleJobQueueOptions: SimpleJobQueueOptions = {
  rateLimiterMaxExecutions: 10,
  rateLimiterWindowSizeInMinutes: 1,
  waitDurationInMilliseconds: 100,
  deleteAfterCompletionMs: 0,
  deleteAfterFailureMs: 0,
};

export async function registerSimpleSqliteJobQueue<I, O, C extends Job<I, O>>(
  db: any,
  queueName: string,
  jobCls: new (param: JobConstructorParam<I, O>) => C,
  {
    rateLimiterMaxExecutions = 10,
    rateLimiterWindowSizeInMinutes = 1,
    waitDurationInMilliseconds = 100,
    deleteAfterCompletionMs = 0,
    deleteAfterFailureMs = 0,
  }: SimpleJobQueueOptions = { ...defaultSimpleJobQueueOptions }
) {
  const jobQueue = new JobQueue<I, O, C>(queueName, jobCls, {
    storage: new SqliteQueueStorage<I, O>(db, queueName),
    limiter: new SqliteRateLimiter(
      db,
      queueName,
      rateLimiterMaxExecutions,
      rateLimiterWindowSizeInMinutes
    ),
    waitDurationInMilliseconds,
    deleteAfterCompletionMs,
    deleteAfterFailureMs,
  });
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
  return jobQueue;
}

export async function registerSimpleInMemoryJobQueue<I, O, C extends Job<I, O>>(
  queueName: string,
  jobCls: new (param: JobConstructorParam<I, O>) => C,
  {
    rateLimiterMaxExecutions = 10,
    rateLimiterWindowSizeInMinutes = 1,
    waitDurationInMilliseconds = 100,
    deleteAfterCompletionMs = 0,
    deleteAfterFailureMs = 0,
  }: SimpleJobQueueOptions = { ...defaultSimpleJobQueueOptions }
) {
  const jobQueue = new JobQueue<I, O, C>(queueName, jobCls, {
    storage: new InMemoryQueueStorage<I, O>(queueName),
    limiter: new InMemoryRateLimiter(rateLimiterMaxExecutions, rateLimiterWindowSizeInMinutes),
    waitDurationInMilliseconds,
    deleteAfterCompletionMs,
    deleteAfterFailureMs,
  });
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
  return jobQueue;
}

export async function registerSimpleIndexedDbJobQueue<I, O, C extends Job<I, O>>(
  queueName: string,
  jobCls: new (param: JobConstructorParam<I, O>) => C,
  {
    rateLimiterMaxExecutions = 10,
    rateLimiterWindowSizeInMinutes = 1,
    waitDurationInMilliseconds = 100,
    deleteAfterCompletionMs = 0,
    deleteAfterFailureMs = 0,
  }: SimpleJobQueueOptions = { ...defaultSimpleJobQueueOptions }
) {
  const jobQueue = new IndexedDbJobQueue<I, O, C>(queueName, jobCls, {
    storage: new IndexedDbQueueStorage<I, O>(queueName),
    limiter: new InMemoryRateLimiter(rateLimiterMaxExecutions, rateLimiterWindowSizeInMinutes),
    waitDurationInMilliseconds,
    deleteAfterCompletionMs,
    deleteAfterFailureMs,
  });
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
  return jobQueue;
}

export async function registerSimplePostgresJobQueue<I, O, C extends Job<I, O>>(
  db: any,
  queueName: string,
  jobCls: new (param: JobConstructorParam<I, O>) => C,
  {
    rateLimiterMaxExecutions = 10,
    rateLimiterWindowSizeInMinutes = 1,
    waitDurationInMilliseconds = 100,
    deleteAfterCompletionMs = 0,
    deleteAfterFailureMs = 0,
  }: SimpleJobQueueOptions = { ...defaultSimpleJobQueueOptions }
) {
  const jobQueue = new PostgresJobQueue<I, O, C>(db, queueName, jobCls, {
    storage: new PostgresQueueStorage<I, O>(db, queueName),
    limiter: new PostgresRateLimiter(
      db,
      queueName,
      rateLimiterMaxExecutions,
      rateLimiterWindowSizeInMinutes
    ),
    waitDurationInMilliseconds,
    deleteAfterCompletionMs,
    deleteAfterFailureMs,
  });
  getTaskQueueRegistry().registerQueue(jobQueue);
  jobQueue.start();
  return jobQueue;
}
