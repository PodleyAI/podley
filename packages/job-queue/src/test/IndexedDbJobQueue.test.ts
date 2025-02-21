//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { IndexedDbJobQueue } from "../storage/IndexedDbJobQueue";
import { InMemoryRateLimiter } from "../storage/InMemoryRateLimiter";
import { runGenericJobQueueTests, TestJob, TInput, TOutput } from "./genericJobQueueTests";
import { nanoid } from "nanoid";
import { describe } from "bun:test";

function createIndexedDbJobQueue() {
  return new IndexedDbJobQueue<TInput, TOutput>(`idx_test_${nanoid()}`, `jobs`, TestJob, {
    limiter: new InMemoryRateLimiter(4, 1),
    waitDurationInMilliseconds: 1,
  });
}

describe("IndexedDbJobQueue", () => {
  runGenericJobQueueTests(createIndexedDbJobQueue);
});
