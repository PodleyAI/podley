//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteTabularRepository } from "@podley/storage";
import {
  runGenericTabularRepositoryTests,
  CompoundPrimaryKeyNames,
  SearchPrimaryKeyNames,
  CompoundSchema,
  SearchSchema,
} from "./genericTabularRepositoryTests.test";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";

describe("SqliteTabularRepository", () => {
  runGenericTabularRepositoryTests(
    async () =>
      new SqliteTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        ":memory:",
        `sql_test_${uuid4().replace(/-/g, "_")}`,
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    async () =>
      new SqliteTabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>(
        ":memory:",
        `sql_test_${uuid4().replace(/-/g, "_")}`,
        SearchSchema,
        SearchPrimaryKeyNames,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
