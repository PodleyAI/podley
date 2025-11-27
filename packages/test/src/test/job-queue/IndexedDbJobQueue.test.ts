/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryRateLimiter } from "@workglow/job-queue";
import { IndexedDbQueueStorage } from "@workglow/storage";
import "fake-indexeddb/auto";
import { describe } from "vitest";
import { runGenericJobQueueTests } from "./genericJobQueueTests";

describe("IndexedDbJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new IndexedDbQueueStorage(queueName),
    (queueName: string, maxExecutions: number, windowSizeInSeconds: number) =>
      new InMemoryRateLimiter({ maxExecutions, windowSizeInSeconds })
  );
});
