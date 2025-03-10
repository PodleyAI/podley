//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Job, JobConstructorParam, JobQueue, JobQueueOptions } from "@ellmers/job-queue";
import { IndexedDbQueueStorage } from "@ellmers/storage";
import { createServiceToken } from "@ellmers/util";

export const INDEXED_DB_JOB_QUEUE =
  createServiceToken<JobQueue<any, any, any>>("jobQueue.indexedDb");

export class IndexedDbJobQueue<I, O, C extends Job<I, O>> extends JobQueue<I, O, C> {
  constructor(
    queueName: string,
    jobCls: new (param: JobConstructorParam<I, O>) => C,
    options: JobQueueOptions<I, O>
  ) {
    options.storage ??= new IndexedDbQueueStorage<I, O>(queueName);
    super(queueName, jobCls, options);
  }
}
