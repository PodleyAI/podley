//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe } from "bun:test";
import { InMemoryQueueStorage } from "../storage/InMemoryQueueStorage";
import { runGenericJobQueueTests } from "./genericJobQueueTests";
import { InMemoryRateLimiter } from "../storage/InMemoryRateLimiter";

describe("JobQueue+InMemoryQueueStorage", () => {
  runGenericJobQueueTests(
    (queueName: string) => new InMemoryQueueStorage(queueName),
    (queueName: string, maxRequests: number, windowSizeInMinutes: number) =>
      new InMemoryRateLimiter(maxRequests, windowSizeInMinutes)
  );
});
