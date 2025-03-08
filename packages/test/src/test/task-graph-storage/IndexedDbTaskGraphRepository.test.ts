//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { IndexedDbTaskGraphRepository } from "../../binding/IndexedDbTaskGraphRepository";
import { runGenericTaskGraphRepositoryTests } from "./genericTaskGraphRepositoryTests.test";
import { uuid4 } from "@ellmers/util";
import { describe } from "bun:test";

describe("IndexedDbTaskGraphRepository", () => {
  runGenericTaskGraphRepositoryTests(
    async () => new IndexedDbTaskGraphRepository(`idx_test_${uuid4()}`)
  );
});
