//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Job, JobConstructorParam, JobQueue, JobQueueOptions } from "@ellmers/job-queue";
import { PostgresQueueStorage } from "@ellmers/storage";
import { createServiceToken } from "@ellmers/util";

export const POSTGRES_JOB_QUEUE = createServiceToken<JobQueue<any, any, any>>("jobQueue.postgres");

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
