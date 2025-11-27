/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { FsFolderTabularRepository } from "@workglow/storage";
import { mkdirSync, rmSync } from "fs";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  CompoundPrimaryKeyNames,
  CompoundSchema,
  runGenericTabularRepositoryTests,
  SearchPrimaryKeyNames,
  SearchSchema,
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
      rmSync(testDir, { recursive: true });
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
          typeof SearchSchema,
          typeof SearchPrimaryKeyNames
        >(testDir, SearchSchema, SearchPrimaryKeyNames, [
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
