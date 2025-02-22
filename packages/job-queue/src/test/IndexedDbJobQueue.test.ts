//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { describe } from "bun:test";
import { IndexedDbQueueStorage } from "@ellmers/storage";
import { runGenericJobQueueTests } from "./genericJobQueueTests";
import { InMemoryRateLimiter } from "../storage/InMemoryRateLimiter";

describe("IndexedDbJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new IndexedDbQueueStorage(queueName),
    (queueName: string, maxRequests: number, windowSizeInMinutes: number) =>
      new InMemoryRateLimiter(maxRequests, windowSizeInMinutes)
  );
});
