//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Job, JobConstructorParam, JobQueue, JobQueueOptions } from "@podley/job-queue";
import { PostgresQueueStorage } from "@podley/storage";
import { createServiceToken } from "@podley/util";

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
