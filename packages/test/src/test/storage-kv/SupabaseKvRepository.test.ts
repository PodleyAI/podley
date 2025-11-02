//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  ExtractPrimaryKey,
  ExtractValue,
  SupabaseKvRepository,
  SupabaseTabularRepository,
} from "@podley/storage";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";
import { describe } from "bun:test";
import { createSupabaseMockClient } from "../helpers/SupabaseMockClient";
import { uuid4 } from "@podley/util";
import { Static, TObject } from "typebox";
import { DefaultKeyValueKey, DefaultKeyValueSchema } from "@podley/storage";

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
