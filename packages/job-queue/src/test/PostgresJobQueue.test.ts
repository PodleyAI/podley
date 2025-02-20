//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PGlite } from "@electric-sql/pglite";
import { nanoid } from "nanoid";
import { describe } from "bun:test";
import { PostgresRateLimiter } from "../storage/PostgresRateLimiter";
import { PostgresJobQueue } from "../storage/PostgresJobQueue";
import { TestJob } from "./genericJobQueueTests";
import { runGenericJobQueueTests } from "./genericJobQueueTests";
import { Pool } from "pg";

const db = new PGlite() as unknown as Pool;

function createPostgresJobQueue() {
  const queueName = `sqlite_test_queue_${nanoid()}`;
  return new PostgresJobQueue(db, queueName, TestJob, {
    limiter: new PostgresRateLimiter(db, queueName, 4, 1),
    waitDurationInMilliseconds: 1,
  });
}

describe("PostgresJobQueue", () => {
  runGenericJobQueueTests(createPostgresJobQueue);
});
