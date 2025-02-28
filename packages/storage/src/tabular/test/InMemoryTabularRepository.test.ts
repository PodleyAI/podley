//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryTabularRepository } from "../InMemoryTabularRepository";
import {
  runGenericTabularRepositoryTests,
  PrimaryKey,
  Value,
  PrimaryKeySchema,
  ValueSchema,
  CompoundKey,
  CompoundValue,
  CompoundPrimaryKeySchema,
  CompoundValueSchema,
} from "./genericTabularRepositoryTests";
import { describe } from "bun:test";

describe("InMemoryTabularRepository", () => {
  runGenericTabularRepositoryTests(
    async () =>
      new InMemoryTabularRepository<PrimaryKey, Value, typeof PrimaryKeySchema, typeof ValueSchema>(
        PrimaryKeySchema,
        ValueSchema
      ),
    async () =>
      new InMemoryTabularRepository<
        CompoundKey,
        CompoundValue,
        typeof CompoundPrimaryKeySchema,
        typeof CompoundValueSchema
      >(CompoundPrimaryKeySchema, CompoundValueSchema, [
        "category",
        ["category", "subcategory"],
        ["subcategory", "category"],
        "value",
      ])
  );
});
