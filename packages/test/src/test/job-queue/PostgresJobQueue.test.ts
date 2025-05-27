//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { PostgresRateLimiter } from "@podley/job-queue";
import { PostgresQueueStorage } from "@podley/storage";
import { runGenericJobQueueTests } from "./genericJobQueueTests.test";

const db = new PGlite() as unknown as Pool;

describe("PostgresJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new PostgresQueueStorage(db, queueName),
    (queueName: string, maxExecutions: number, windowSizeInSeconds: number) =>
      new PostgresRateLimiter(db, queueName, {
        maxExecutions,
        windowSizeInSeconds,
      })
  );
});
