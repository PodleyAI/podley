//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { PostgresRateLimiter } from "../storage/PostgresRateLimiter";
import { runGenericJobQueueTests } from "./genericJobQueueTests";
import { PostgresQueueStorage } from "../storage/PostgresQueueStorage";

const db = new PGlite() as unknown as Pool;

describe("JobQueue+PostgresQueueStorage", () => {
  runGenericJobQueueTests(
    (queueName: string) => new PostgresQueueStorage(db, queueName),
    (queueName: string, maxRequests: number, windowSizeInMinutes: number) =>
      new PostgresRateLimiter(db, queueName, maxRequests, windowSizeInMinutes)
  );
});
