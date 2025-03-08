//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { IndexedDbTaskOutputRepository } from "../../binding/IndexedDbTaskOutputRepository";
import { runGenericTaskOutputRepositoryTests } from "./genericTaskOutputRepositoryTests.test";
import { uuid4 } from "@ellmers/util";
import { describe } from "bun:test";

describe("IndexedDbTaskOutputRepository", () => {
  runGenericTaskOutputRepositoryTests(
    async () => new IndexedDbTaskOutputRepository(`idx_test_${uuid4()}`)
  );
});
