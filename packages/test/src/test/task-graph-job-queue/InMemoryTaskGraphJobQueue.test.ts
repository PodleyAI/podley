/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConcurrencyLimiter, JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";

describe("InMemoryTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const queueName = `inMemory_test_queue_${uuid4()}`;
    return new JobQueue(queueName, TestJob, {
      storage: new InMemoryQueueStorage(queueName),
      limiter: new ConcurrencyLimiter(1, 10),
      waitDurationInMilliseconds: 1,
    });
  });
});
