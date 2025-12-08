/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryTabularRepository } from "@workglow/storage";
import { describe } from "vitest";
import { runGenericTabularRepositorySubscriptionTests } from "./genericTabularRepositorySubscriptionTests";
import {
  CompoundPrimaryKeyNames,
  CompoundSchema,
  runGenericTabularRepositoryTests,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests";

describe("InMemoryTabularRepository", () => {
  runGenericTabularRepositoryTests(
    async () =>
      new InMemoryTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    async () =>
      new InMemoryTabularRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>(
        SearchSchema,
        SearchPrimaryKeyNames,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );

  runGenericTabularRepositorySubscriptionTests(
    async () =>
      new InMemoryTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    { usesPolling: false }
  );
});
