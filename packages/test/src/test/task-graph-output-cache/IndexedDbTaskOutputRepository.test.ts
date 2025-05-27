//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { IndexedDbTaskOutputRepository } from "../../binding/IndexedDbTaskOutputRepository";
import { runGenericTaskOutputRepositoryTests } from "./genericTaskOutputRepositoryTests.test";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";

describe("IndexedDbTaskOutputRepository", () => {
  runGenericTaskOutputRepositoryTests(async () => {
    const id = uuid4().replace(/-/g, "_");
    const dbName = `idx_test_${id}`;
    return new IndexedDbTaskOutputRepository(dbName);
  });
});
