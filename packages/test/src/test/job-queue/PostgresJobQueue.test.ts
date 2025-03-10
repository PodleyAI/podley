//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { PostgresRateLimiter } from "@ellmers/job-queue";
import { PostgresQueueStorage } from "@ellmers/storage";
import { runGenericJobQueueTests } from "./genericJobQueueTests.test";

const db = new PGlite() as unknown as Pool;

describe("PostgresJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new PostgresQueueStorage(db, queueName),
    (queueName: string, maxRequests: number, windowSizeInSeconds: number) =>
      new PostgresRateLimiter(db, queueName, maxRequests, windowSizeInSeconds)
  );
});
