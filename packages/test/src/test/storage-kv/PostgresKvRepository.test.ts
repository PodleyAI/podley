//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresKvRepository } from "@ellmers/storage";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests.test";
import { describe } from "bun:test";
import type { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import { uuid4 } from "@ellmers/util";

const db = new PGlite() as unknown as Pool;

describe("PostgresKvRepository", () => {
  runGenericKvRepositoryTests(async (keyType, valueType) => {
    const dbName = `pg_test_${uuid4().replace(/-/g, "_")}`;
    return new PostgresKvRepository(db, dbName, keyType, valueType);
  });
});
