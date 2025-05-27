//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Job, JobConstructorParam, JobQueue, JobQueueOptions } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";
import { createServiceToken } from "@podley/util";

export const IN_MEMORY_JOB_QUEUE = createServiceToken<JobQueue<any, any, any>>("jobQueue.inMemory");

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
