//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteTabularRepository } from "../SqliteTabularRepository";
import {
  runGenericTabularRepositoryTests,
  PrimaryKey,
  Value,
  PrimaryKeySchema,
  ValueSchema,
  CompoundKey,
  CompoundValue,
  CompoundPrimaryKeySchema,
  CompoundValueSchema,
} from "./genericTabularRepositoryTests";
import { nanoid } from "nanoid";
import { describe } from "bun:test";

describe("SqliteTabularRepository", () => {
  runGenericTabularRepositoryTests(
    async () =>
      new SqliteTabularRepository<PrimaryKey, Value>(
        ":memory:",
        `sql_test_${nanoid()}`,
        PrimaryKeySchema,
        ValueSchema
      ),
    async () =>
      new SqliteTabularRepository<CompoundKey, CompoundValue>(
        ":memory:",
        `sql_test_${nanoid()}`,
        CompoundPrimaryKeySchema,
        CompoundValueSchema,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
