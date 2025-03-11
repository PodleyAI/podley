//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { IndexedDbModelRepository } from "@ellmers/ai";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests.test";
import { uuid4 } from "@ellmers/util";
import { describe } from "bun:test";

describe("IndexedDbModelRepository", () => {
  runGenericModelRepositoryTests(async () => {
    const id = uuid4().replace(/-/g, "_");
    const modelDbName = `idx_model_test_${id}`;
    const task2modelDbName = `idx_task2model_test_${id}`;
    return new IndexedDbModelRepository(modelDbName, task2modelDbName);
  });
});
