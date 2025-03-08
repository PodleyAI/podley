//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ConcurrencyLimiter, JobQueue } from "@ellmers/job-queue";
import { SqliteQueueStorage } from "@ellmers/storage";
import { Sqlite } from "@ellmers/util";
import { describe } from "bun:test";
import { uuid4 } from "@ellmers/util";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests.test";

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
