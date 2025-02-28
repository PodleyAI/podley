//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, beforeEach, afterEach, expect, test } from "bun:test";
import { rmdirSync, mkdirSync } from "fs";
import { FsFolderTabularRepository } from "../FsFolderTabularRepository";
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

const testDir = ".cache/test/testing";

describe("FsFolderTabularRepository", () => {
  beforeEach(() => {
    try {
      mkdirSync(testDir, { recursive: true });
    } catch {}
  });

  afterEach(async () => {
    try {
      rmdirSync(testDir, { recursive: true });
    } catch {}
  });

  // Run basic storage tests that don't involve search
  describe("basic functionality", () => {
    runGenericTabularRepositoryTests(
      async () =>
        new FsFolderTabularRepository<
          PrimaryKey,
          Value,
          typeof PrimaryKeySchema,
          typeof ValueSchema
        >(testDir, PrimaryKeySchema, ValueSchema)
    );
  });

  // Add specific tests for search functionality
  describe("search functionality", () => {
    test("should throw error when attempting to search", async () => {
      const repo = new FsFolderTabularRepository<
        CompoundKey,
        CompoundValue,
        typeof CompoundPrimaryKeySchema,
        typeof CompoundValueSchema
      >(testDir, CompoundPrimaryKeySchema, CompoundValueSchema, [
        "category",
        ["category", "subcategory"],
        ["subcategory", "category"],
        "value",
      ]);

      expect(repo.search({ category: "test" })).rejects.toThrow(
        "Search not supported for FsFolderTabularRepository"
      );
    });
  });
});
