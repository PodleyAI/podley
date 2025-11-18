/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { FsFolderKvRepository } from "@podley/storage";
import { afterEach, beforeEach, describe } from "bun:test";
import { mkdirSync, rmdirSync } from "fs";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

const testDir = ".cache/test/testing";

describe("FsFolderKvRepository", () => {
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

  runGenericKvRepositoryTests(async (keyType, valueType) => {
    return new FsFolderKvRepository(
      testDir,
      (key) => String(key) + "." + valueType,
      keyType,
      valueType
    );
  });
});
