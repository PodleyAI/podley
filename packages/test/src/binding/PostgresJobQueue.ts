/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job, JobConstructorParam, JobQueue, JobQueueOptions } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
import { createServiceToken } from "@workglow/util";

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
