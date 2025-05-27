//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { InMemoryRateLimiter, JobQueue } from "@podley/job-queue";
import { describe } from "bun:test";
import { uuid4 } from "@podley/util";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests.test";
import { IndexedDbQueueStorage } from "@podley/storage";

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
