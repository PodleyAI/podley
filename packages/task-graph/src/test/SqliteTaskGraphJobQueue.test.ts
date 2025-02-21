//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ConcurrencyLimiter, SqliteJobQueue } from "@ellmers/job-queue";
import { Database } from "bun:sqlite";
import { describe } from "bun:test";
import { nanoid } from "nanoid";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";

describe("SqliteTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const db = new Database(":memory:");
    const queue = new SqliteJobQueue(db, `sqlite_test_queue_${nanoid()}`, TestJob, {
      limiter: new ConcurrencyLimiter(1, 10),
      waitDurationInMilliseconds: 1,
    });
    queue.ensureTableExists();
    return queue;
  });
});
