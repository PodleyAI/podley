/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryRateLimiter } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";
import { describe } from "vitest";
import { runGenericJobQueueTests } from "./genericJobQueueTests";

describe("InMemoryJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new InMemoryQueueStorage(queueName),
    (queueName: string, maxExecutions: number, windowSizeInSeconds: number) =>
      new InMemoryRateLimiter({ maxExecutions, windowSizeInSeconds })
  );
});
