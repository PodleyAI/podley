//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteJobQueue } from "@ellmers/job-queue";
import { runGenericTaskGraphJobQueueTests } from "./genericTaskGraphJobQueueTests";
import { TestJob } from "./genericTaskGraphJobQueueTests";
import { Database } from "bun:sqlite";
import { nanoid } from "nanoid";
import { describe } from "bun:test";
import { ConcurrencyLimiter } from "@ellmers/job-queue";

describe("SqliteTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const db = new Database(":memory:");
    const queue = new SqliteJobQueue(
      db,
      `sqlite_test_queue_${nanoid()}`,
      new ConcurrencyLimiter(1, 10),
      TestJob,
      10
    );
    queue.ensureTableExists();
    return queue;
  });
});
