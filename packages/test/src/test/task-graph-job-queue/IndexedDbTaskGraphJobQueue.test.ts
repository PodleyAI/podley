/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryRateLimiter, JobQueue } from "@workglow/job-queue";
import { IndexedDbQueueStorage } from "@workglow/storage";
import { uuid4 } from "@workglow/util";
import "fake-indexeddb/auto";
import { describe } from "vitest";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";

describe("IndexedDbTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const queueName = `idx_test_queue_${uuid4()}`;
    return new JobQueue(queueName, TestJob, {
      storage: new IndexedDbQueueStorage(queueName),
      limiter: new InMemoryRateLimiter({ maxExecutions: 1, windowSizeInSeconds: 10 }),
      waitDurationInMilliseconds: 1,
    });
  });
});
