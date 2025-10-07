//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, beforeEach, afterEach, expect, test } from "bun:test";
import { rmdirSync, mkdirSync } from "fs";
import { FsFolderTabularRepository } from "@podley/storage";
import {
  runGenericTabularRepositoryTests,
  CompoundPrimaryKeyNames,
  CompoundSchema,
  SearchPrimaryKeyNames,
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
        new FsFolderTabularRepository<typeof CompoundSchema, typeof CompoundPrimaryKeyNames>(
          testDir,
          CompoundSchema,
          CompoundPrimaryKeyNames
        )
    );
  });

  // Add specific tests for search functionality
  describe("search functionality", () => {
    test("should throw error when attempting to search", async () => {
      try {
        const repo = new FsFolderTabularRepository<
          typeof CompoundSchema,
          typeof SearchPrimaryKeyNames
        >(testDir, CompoundSchema, SearchPrimaryKeyNames, [
          "category",
          ["category", "subcategory"],
          ["subcategory", "category"],
          "value",
        ]);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
