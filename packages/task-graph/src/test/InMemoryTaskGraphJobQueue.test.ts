//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ConcurrencyLimiter, InMemoryJobQueue } from "@ellmers/job-queue";
import { describe } from "bun:test";
import { runGenericTaskGraphJobQueueTests, TestJob } from "./genericTaskGraphJobQueueTests";

describe("InMemoryTaskGraphJobQueue", () => {
  runGenericTaskGraphJobQueueTests(
    async () =>
      new InMemoryJobQueue("inMemory", TestJob, {
        limiter: new ConcurrencyLimiter(1, 10),
        waitDurationInMilliseconds: 1,
      })
  );
});
