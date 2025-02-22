//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresQueueStorage } from "@ellmers/storage";
import { Job, JobConstructorParam } from "../job/Job";
import { JobQueueOptions } from "../job/IJobQueue";
import { JobQueue } from "../job/JobQueue";
import { PostgresRateLimiter } from "../storage/PostgresRateLimiter";

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

export async function createSimplePostgresJobQueue<I, O, C extends Job<I, O>>(
  db: any,
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
  const jobQueue = new PostgresJobQueue<I, O, C>(db, queueName, jobCls, {
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
  jobQueue.start();
  return jobQueue;
}
