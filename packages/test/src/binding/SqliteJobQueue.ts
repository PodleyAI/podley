/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job, JobConstructorParam, JobQueue, JobQueueOptions } from "@podley/job-queue";
import { SqliteQueueStorage } from "@podley/storage";
import { createServiceToken } from "@podley/util";

export const SQLITE_JOB_QUEUE = createServiceToken<JobQueue<any, any, any>>("jobQueue.sqlite");

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
