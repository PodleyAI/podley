/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DefaultKeyValueKey,
  DefaultKeyValueSchema,
  ExtractPrimaryKey,
  ExtractValue,
  SupabaseKvRepository,
  SupabaseTabularRepository,
} from "@podley/storage";
import { uuid4 } from "@podley/util";
import { Static, TObject } from "@sinclair/typebox";
import { describe } from "bun:test";
import { createSupabaseMockClient } from "../helpers/SupabaseMockClient";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

class SupabaseTabularTestRepository<
  Schema extends TObject,
  PrimaryKeyNames extends ReadonlyArray<keyof Static<Schema>>,
  PrimaryKey = ExtractPrimaryKey<Schema, PrimaryKeyNames>,
  Entity = Static<Schema>,
  Value = ExtractValue<Schema, PrimaryKeyNames>,
> extends SupabaseTabularRepository<Schema, PrimaryKeyNames, PrimaryKey, Entity, Value> {
  protected isSetup = false; // force setup to run, which is not the default
}

describe("SupabaseKvRepository", () => {
  const client = createSupabaseMockClient();
  runGenericKvRepositoryTests(async (keyType, valueType) => {
    const tableName = `supabase_test_${uuid4().replace(/-/g, "_")}`;
    return new SupabaseKvRepository(
      client,
      tableName,
      keyType,
      valueType,
      new SupabaseTabularTestRepository(
        client,
        tableName,
        DefaultKeyValueSchema,
        DefaultKeyValueKey
      )
    );
  });
});
