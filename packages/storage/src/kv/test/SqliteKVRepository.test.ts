//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteKVRepository } from "../SqliteKVRepository";
import {
  runGenericKVRepositoryTests,
  PrimaryKey,
  Value,
  PrimaryKeySchema,
  ValueSchema,
  CompoundKey,
  CompoundValue,
  CompoundPrimaryKeySchema,
  CompoundValueSchema,
} from "./genericKVRepositoryTests";
import { nanoid } from "nanoid";
import { describe } from "bun:test";

describe("SqliteKVRepository", () => {
  runGenericKVRepositoryTests(
    async () => new SqliteKVRepository(":memory:", `sql_test_${nanoid()}`),
    async () =>
      new SqliteKVRepository<PrimaryKey, Value>(
        ":memory:",
        `sql_test_${nanoid()}`,
        PrimaryKeySchema,
        ValueSchema
      ),
    async () =>
      new SqliteKVRepository<CompoundKey, CompoundValue>(
        ":memory:",
        `sql_test_${nanoid()}`,
        CompoundPrimaryKeySchema,
        CompoundValueSchema,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
