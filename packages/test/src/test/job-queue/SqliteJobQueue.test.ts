/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { SqliteRateLimiter } from "@workglow/job-queue";
import { Sqlite } from "@workglow/sqlite";
import { SqliteQueueStorage } from "@workglow/storage";
import { describe } from "vitest";
import { runGenericJobQueueTests } from "./genericJobQueueTests";

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
