/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job, JobConstructorParam, JobQueue, JobQueueOptions } from "@podley/job-queue";
import { IndexedDbQueueStorage } from "@podley/storage";
import { createServiceToken } from "@podley/util";

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
