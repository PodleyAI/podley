/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { SqliteTabularRepository } from "@workglow/storage";
import { uuid4 } from "@workglow/util";
import { describe } from "vitest";
import {
  CompoundPrimaryKeyNames,
  CompoundSchema,
  runGenericTabularRepositoryTests,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests";

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
