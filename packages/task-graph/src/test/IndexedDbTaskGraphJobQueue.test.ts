//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { IndexedDbJobQueue, InMemoryRateLimiter } from "@ellmers/job-queue";
import { describe } from "bun:test";
import { nanoid } from "nanoid";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";

describe("IndexedDbTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(async () => {
    return new IndexedDbJobQueue("idx_test", `queue_${nanoid()}`, TestJob, {
      limiter: new InMemoryRateLimiter(1, 10),
      waitDurationInMilliseconds: 1,
    });
  });
});
