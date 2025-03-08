//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { InMemoryRateLimiter, JobQueue } from "@ellmers/job-queue";
import { describe } from "bun:test";
import { uuid4 } from "@ellmers/util";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";
import { IndexedDbQueueStorage } from "@ellmers/storage";

describe("IndexedDbTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const queueName = `idx_test_queue_${uuid4()}`;
    return new JobQueue(queueName, TestJob, {
      storage: new IndexedDbQueueStorage(queueName),
      limiter: new InMemoryRateLimiter(1, 10),
      waitDurationInMilliseconds: 1,
    });
  });
});
