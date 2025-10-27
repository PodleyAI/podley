//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import "fake-indexeddb/auto";
import { uuid4 } from "@podley/util";
import { afterEach, describe } from "bun:test";
import { IndexedDbTabularRepository } from "@podley/storage";
import {
  CompoundPrimaryKeyNames,
  runGenericTabularRepositoryTests,
  CompoundSchema,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests";

describe("IndexedDbTabularRepository", () => {
  const dbName = `idx_test_${uuid4().replace(/-/g, "_")}`;

  runGenericTabularRepositoryTests(
    async () =>
      new IndexedDbTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        `${dbName}_complex`,
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    async () =>
      new IndexedDbTabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>(
        `${dbName}_compound`,
        SearchSchema,
        SearchPrimaryKeyNames,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
