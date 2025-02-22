//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe } from "bun:test";
import { InMemoryQueueStorage } from "@ellmers/storage";
import { runGenericJobQueueTests } from "./genericJobQueueTests";
import { InMemoryRateLimiter } from "../storage/InMemoryRateLimiter";

describe("InMemoryJobQueue", () => {
  runGenericJobQueueTests(
    (queueName: string) => new InMemoryQueueStorage(queueName),
    (queueName: string, maxRequests: number, windowSizeInMinutes: number) =>
      new InMemoryRateLimiter(maxRequests, windowSizeInMinutes)
  );
});
