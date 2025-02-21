//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ConcurrencyLimiter, InMemoryQueueStorage, JobQueue } from "@ellmers/job-queue";
import { describe } from "bun:test";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";
import { nanoid } from "nanoid";

describe("InMemoryTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    const queueName = `inMemory_test_queue_${nanoid()}`;
    return new JobQueue(queueName, TestJob, {
      storage: new InMemoryQueueStorage(queueName),
      limiter: new ConcurrencyLimiter(1, 10),
      waitDurationInMilliseconds: 1,
    });
  });
});
