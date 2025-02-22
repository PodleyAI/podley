//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ConcurrencyLimiter, JobQueue } from "@ellmers/job-queue";
import { SqliteQueueStorage } from "@ellmers/storage";
import { Database } from "bun:sqlite";
import { describe } from "bun:test";
import { nanoid } from "nanoid";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";

describe("SqliteTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const db = new Database(":memory:");
    const queueName = `sqlite_test_queue_${nanoid()}`;
    const queue = new JobQueue(queueName, TestJob, {
      storage: new SqliteQueueStorage(db, queueName),
      limiter: new ConcurrencyLimiter(1, 10),
      waitDurationInMilliseconds: 1,
    });
    return queue;
  });
});
