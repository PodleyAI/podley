//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryTabularRepository } from "../InMemoryTabularRepository";
import {
  runGenericTabularRepositoryTests,
  CompoundPrimaryKeyNames,
  CompoundSchema,
  SearchPrimaryKeyNames,
  SearchSchema,
} from "./genericTabularRepositoryTests";
import { describe } from "bun:test";

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
});
