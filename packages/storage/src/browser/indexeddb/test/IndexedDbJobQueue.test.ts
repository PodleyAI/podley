//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { TaskOutput, TaskInput } from "@ellmers/task-graph";
import { IndexedDbJobQueue } from "../IndexedDbJobQueue";
import { InMemoryRateLimiter } from "../../inmemory/InMemoryRateLimiter";
import { runGenericJobQueueTests, TestJob } from "../../../test/genericJobQueueTests";
import { nanoid } from "nanoid";
import { describe } from "bun:test";

function createIndexedDbJobQueue() {
  return new IndexedDbJobQueue<TaskInput, TaskOutput>(
    `idx_test_${nanoid()}`,
    `jobs`,
    new InMemoryRateLimiter(4, 1),
    TestJob,
    1
  );
}

describe("IndexedDbJobQueue", () => {
  runGenericJobQueueTests(createIndexedDbJobQueue);
});
