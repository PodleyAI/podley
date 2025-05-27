//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresTabularRepository } from "@podley/storage";
import {
  runGenericTabularRepositoryTests,
  CompoundPrimaryKeyNames,
  CompoundSchema,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests.test";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import type { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";

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
