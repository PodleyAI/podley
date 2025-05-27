//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ConcurrencyLimiter, JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";
import { describe } from "bun:test";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests.test";
import { uuid4 } from "@podley/util";

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
