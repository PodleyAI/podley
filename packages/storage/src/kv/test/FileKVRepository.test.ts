//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, beforeEach, afterEach, expect, test } from "bun:test";
import { rmdirSync, mkdirSync } from "fs";
import { FileKVRepository } from "../FileKVRepository";
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

const testDir = ".cache/test/testing";

describe("FileKVRepository", () => {
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
    runGenericKVRepositoryTests(
      async () => new FileKVRepository(testDir),
      async () => new FileKVRepository<PrimaryKey, Value>(testDir, PrimaryKeySchema, ValueSchema)
    );
  });

  // Add specific tests for search functionality
  describe("search functionality", () => {
    test("should throw error when attempting to search", async () => {
      const repo = new FileKVRepository<CompoundKey, CompoundValue>(
        testDir,
        CompoundPrimaryKeySchema,
        CompoundValueSchema,
        ["category", ["category", "subcategory"], ["subcategory", "category"], "value"]
      );

      expect(repo.search({ category: "test" })).rejects.toThrow(
        "Search not supported for FileKVRepository"
      );
    });
  });
});
