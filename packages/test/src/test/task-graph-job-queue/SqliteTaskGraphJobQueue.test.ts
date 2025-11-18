/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConcurrencyLimiter, JobQueue } from "@podley/job-queue";
import { Sqlite } from "@podley/sqlite";
import { SqliteQueueStorage } from "@podley/storage";
import { TaskInput, TaskOutput } from "@podley/task-graph";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";

describe("SqliteTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const db = new Sqlite.Database(":memory:");
    const queueName = `sqlite_test_queue_${uuid4()}`;
    const storage = new SqliteQueueStorage<TaskInput, TaskOutput>(db, queueName);
    await storage.setupDatabase();
    const queue = new JobQueue(queueName, TestJob, {
      storage: storage,
      limiter: new ConcurrencyLimiter(1, 10),
      waitDurationInMilliseconds: 1,
    });
    return queue;
  });
});
