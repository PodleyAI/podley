/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { PGlite } from "@electric-sql/pglite";
import { PostgresTabularRepository } from "@podley/storage";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import type { Pool } from "pg";
import {
  CompoundPrimaryKeyNames,
  CompoundSchema,
  runGenericTabularRepositoryTests,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests";

const db = new PGlite() as unknown as Pool;

describe("PostgresTabularRepository", () => {
  runGenericTabularRepositoryTests(
    async () =>
      new PostgresTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        db,
        `sql_test_${uuid4().replace(/-/g, "_")}`,
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    async () =>
      new PostgresTabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>(
        db,
        `sql_test_${uuid4().replace(/-/g, "_")}`,
        SearchSchema,
        SearchPrimaryKeyNames,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
