/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDbTabularRepository } from "@podley/storage";
import { uuid4 } from "@podley/util";
import { describe } from "vitest";
import "fake-indexeddb/auto";
import {
  CompoundPrimaryKeyNames,
  CompoundSchema,
  runGenericTabularRepositoryTests,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests";

describe("IndexedDbTabularRepository", () => {
  const dbName = `idx_test_${uuid4().replace(/-/g, "_")}`;

  runGenericTabularRepositoryTests(
    async () =>
      new IndexedDbTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        `${dbName}_complex`,
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    async () =>
      new IndexedDbTabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>(
        `${dbName}_compound`,
        SearchSchema,
        SearchPrimaryKeyNames,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
