/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { FsFolderJsonKvRepository } from "@podley/storage";
import { afterEach, beforeEach, describe } from "bun:test";
import { mkdirSync, rmdirSync } from "fs";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

const testDir = ".cache/test/testing";

describe("FsFolderJsonKvRepository", () => {
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
    return new FsFolderJsonKvRepository(testDir, keyType, valueType);
  });
});
