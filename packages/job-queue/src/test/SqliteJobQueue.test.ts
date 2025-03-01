//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runGenericJobQueueTests, TestJob } from "./genericJobQueueTests.test";
import { SqliteQueueStorage } from "@ellmers/storage";
import { SqliteRateLimiter } from "../storage/SqliteRateLimiter";
import { describe } from "bun:test";
import { Sqlite } from "@ellmers/util";

const db = new Sqlite.Database(":memory:");

describe("SqliteJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new SqliteQueueStorage(db, queueName),
    (queueName: string, maxRequests: number, windowSizeInSeconds: number) =>
      new SqliteRateLimiter(db, queueName, maxRequests, windowSizeInSeconds)
  );
});
