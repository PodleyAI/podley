/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { PGlite } from "@electric-sql/pglite";
import { PostgresRateLimiter } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
import { Pool } from "pg";
import { describe } from "vitest";
import { runGenericJobQueueTests } from "./genericJobQueueTests";

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
