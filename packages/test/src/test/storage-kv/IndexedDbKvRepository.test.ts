//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { uuid4 } from "@podley/util";
import { afterEach, describe } from "bun:test";
import { IndexedDbKvRepository } from "@podley/storage";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

describe("IndexedDbKvRepository", () => {
  const dbName = `idx_test_${uuid4().replace(/-/g, "_")}`;

  runGenericKvRepositoryTests(
    async (keyType, valueType) => new IndexedDbKvRepository(`${dbName}`, keyType, valueType)
  );
});
