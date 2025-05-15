//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteQueueStorage } from "@ellmers/storage";
import { SqliteRateLimiter } from "@ellmers/job-queue";
import { describe } from "bun:test";
import { Sqlite } from "@ellmers/sqlite";
import { runGenericJobQueueTests } from "./genericJobQueueTests.test";

const db = new Sqlite.Database(":memory:");

describe("SqliteJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new SqliteQueueStorage(db, queueName),
    (queueName: string, maxExecutions: number, windowSizeInSeconds: number) =>
      new SqliteRateLimiter(db, queueName, {
        maxExecutions,
        windowSizeInSeconds,
      })
  );
});
