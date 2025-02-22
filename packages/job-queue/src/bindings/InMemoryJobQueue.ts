//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryQueueStorage } from "@ellmers/storage";
import { Job, JobConstructorParam } from "../job/Job";
import { JobQueueOptions } from "../job/IJobQueue";
import { JobQueue } from "../job/JobQueue";
import { InMemoryRateLimiter } from "../storage/InMemoryRateLimiter";

export class InMemoryJobQueue<I, O, C extends Job<I, O>> extends JobQueue<I, O, C> {
  constructor(
    queueName: string,
    jobCls: new (param: JobConstructorParam<I, O>) => C,
    options: JobQueueOptions<I, O>
  ) {
    options.storage ??= new InMemoryQueueStorage<I, O>(queueName);
    super(queueName, jobCls, options);
  }
}

export async function createSimpleInMemoryJobQueue<I, O, C extends Job<I, O>>(
  queueName: string,
  jobCls: new (param: JobConstructorParam<I, O>) => C = Job as new (
    param: JobConstructorParam<I, O>
  ) => C,
  {
    rateLimiterMaxExecutions = 10,
    rateLimiterWindowSizeInMinutes = 1,
    waitDurationInMilliseconds = 100,
    deleteAfterCompletionMs = 0,
    deleteAfterFailureMs = 0,
  }
) {
  const jobQueue = new InMemoryJobQueue<I, O, C>(queueName, jobCls, {
    limiter: new InMemoryRateLimiter(rateLimiterMaxExecutions, rateLimiterWindowSizeInMinutes),
    waitDurationInMilliseconds,
    deleteAfterCompletionMs,
    deleteAfterFailureMs,
  });
  jobQueue.start();
  return jobQueue;
}
