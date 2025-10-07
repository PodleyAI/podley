//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ConcurrencyLimiter, JobQueue } from "@podley/job-queue";
import { SqliteQueueStorage } from "@podley/storage";
import { Sqlite } from "@podley/sqlite";
import { describe } from "bun:test";
import { uuid4 } from "@podley/util";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";

describe("SqliteTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const db = new Sqlite.Database(":memory:");
    const queueName = `sqlite_test_queue_${uuid4()}`;
    const queue = new JobQueue(queueName, TestJob, {
      storage: new SqliteQueueStorage(db, queueName),
      limiter: new ConcurrencyLimiter(1, 10),
      waitDurationInMilliseconds: 1,
    });
    return queue;
  });
});
