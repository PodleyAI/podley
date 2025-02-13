//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresKVRepository } from "../PostgresKVRepository";
import {
  runGenericKVRepositoryTests,
  PrimaryKey,
  Value,
  PrimaryKeySchema,
  ValueSchema,
} from "./genericKVRepositoryTests";
import { nanoid } from "nanoid";
import { describe } from "bun:test";
import type { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite() as unknown as Pool;

describe("PostgresKVRepository", () => {
  runGenericKVRepositoryTests(
    async () => new PostgresKVRepository(db, `sql_test_${nanoid()}`),
    async () =>
      new PostgresKVRepository<PrimaryKey, Value>(
        db,
        `sql_test_${nanoid()}`,
        PrimaryKeySchema,
        ValueSchema
      )
  );
});
