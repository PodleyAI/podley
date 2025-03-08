//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { IndexedDbModelRepository } from "../IndexedDbModelRepository";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests";
import { uuid4 } from "@ellmers/util";
import { describe } from "bun:test";

describe("IndexedDbModelRepository", () => {
  runGenericModelRepositoryTests(
    async () =>
      new IndexedDbModelRepository(`idx_model_test_${uuid4()}`, `idx_task2model_test_${uuid4()}`)
  );
});
