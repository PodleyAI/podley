/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractPrimaryKey, ExtractValue, SupabaseTabularRepository } from "@podley/storage";
import { uuid4 } from "@podley/util";
import { Static, TObject } from "@sinclair/typebox";
import { describe } from "bun:test";
import { createSupabaseMockClient } from "../helpers/SupabaseMockClient";
import {
  CompoundPrimaryKeyNames,
  CompoundSchema,
  runGenericTabularRepositoryTests,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests";

const client = createSupabaseMockClient();

class SupabaseTabularTestRepository<
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>>,
  // computed types
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> extends SupabaseTabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity, Value> {
  protected isSetup = false; // force setup to run, which is not the default
}

describe("SupabaseTabularRepository", () => {
  runGenericTabularRepositoryTests(
    async () =>
      new SupabaseTabularTestRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
        client,
        `supabase_test_${uuid4().replace(/-/g, "_")}`,
        CompoundSchema,
        CompoundPrimaryKeyNames
      ),
    async () =>
      new SupabaseTabularTestRepository<typeof SearchSchema, typeof SearchPrimaryKeyNames>(
        client,
        `supabase_test_${uuid4().replace(/-/g, "_")}`,
        SearchSchema,
        SearchPrimaryKeyNames,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
