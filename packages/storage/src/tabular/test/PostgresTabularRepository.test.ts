//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresTabularRepository } from "../PostgresTabularRepository";
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
import type { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite() as unknown as Pool;

describe("PostgresTabularRepository", () => {
  runGenericTabularRepositoryTests(
    async () => new PostgresTabularRepository(db, `sql_test_${nanoid()}`),
    async () =>
      new PostgresTabularRepository<PrimaryKey, Value>(
        db,
        `sql_test_${nanoid()}`,
        PrimaryKeySchema,
        ValueSchema
      ),
    async () =>
      new PostgresTabularRepository<CompoundKey, CompoundValue>(
        db,
        `sql_test_${nanoid()}`,
        CompoundPrimaryKeySchema,
        CompoundValueSchema,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
