//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { describe } from "bun:test";
import { IndexedDbQueueStorage } from "@ellmers/storage";
import { runGenericJobQueueTests } from "./genericJobQueueTests.test";
import { InMemoryRateLimiter } from "@ellmers/job-queue";

describe("IndexedDbJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new IndexedDbQueueStorage(queueName),
    (queueName: string, maxExecutions: number, windowSizeInSeconds: number) =>
      new InMemoryRateLimiter({ maxExecutions, windowSizeInSeconds })
  );
});
