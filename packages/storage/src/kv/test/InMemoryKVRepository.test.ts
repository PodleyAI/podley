//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryKVRepository } from "../InMemoryKVRepository";
import {
  runGenericKVRepositoryTests,
  PrimaryKey,
  Value,
  PrimaryKeySchema,
  ValueSchema,
  CompoundKey,
  CompoundValue,
  CompoundPrimaryKeySchema,
  CompoundValueSchema,
} from "./genericKVRepositoryTests";
import { describe } from "bun:test";

describe("InMemoryKVRepository", () => {
  runGenericKVRepositoryTests(
    async () => new InMemoryKVRepository(),
    async () => new InMemoryKVRepository<PrimaryKey, Value>(PrimaryKeySchema, ValueSchema),
    async () =>
      new InMemoryKVRepository<CompoundKey, CompoundValue>(
        CompoundPrimaryKeySchema,
        CompoundValueSchema,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      )
  );
});
