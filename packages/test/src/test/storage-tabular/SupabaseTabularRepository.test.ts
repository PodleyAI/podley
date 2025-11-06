//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ExtractPrimaryKey, ExtractValue, SupabaseTabularRepository } from "@podley/storage";
import {
  runGenericTabularRepositoryTests,
  CompoundPrimaryKeyNames,
  CompoundSchema,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import { createSupabaseMockClient } from "../helpers/SupabaseMockClient";
import { Static, TObject } from "@podley/util";

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
