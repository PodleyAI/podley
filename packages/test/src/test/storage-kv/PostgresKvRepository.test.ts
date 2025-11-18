/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { PGlite } from "@electric-sql/pglite";
import { PostgresKvRepository } from "@podley/storage";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import type { Pool } from "pg";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

const db = new PGlite() as unknown as Pool;

describe("PostgresKvRepository", () => {
  runGenericKvRepositoryTests(async (keyType, valueType) => {
    const dbName = `pg_test_${uuid4().replace(/-/g, "_")}`;
    return new PostgresKvRepository(db, dbName, keyType, valueType);
  });
});
