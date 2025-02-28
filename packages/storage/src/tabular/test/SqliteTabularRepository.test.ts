//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteTabularRepository } from "../SqliteTabularRepository";
import {
  runGenericTabularRepositoryTests,
  CompoundPrimaryKeyNames,
  SearchPrimaryKeyNames,
  CompoundSchema,
  SearchSchema,
} from "./genericTabularRepositoryTests";
import { nanoid } from "nanoid";
import { describe } from "bun:test";

describe("SqliteTabularRepository", () => {
  runGenericTabularRepositoryTests(
    async () =>
      new SqliteTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        ":memory:",
        `sql_test_${nanoid()}`,
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    async () =>
      new SqliteTabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>(
        ":memory:",
        `sql_test_${nanoid()}`,
        SearchSchema,
        SearchPrimaryKeyNames,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
