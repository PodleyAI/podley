/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDbKvRepository } from "@podley/storage";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import "fake-indexeddb/auto";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

describe("IndexedDbKvRepository", () => {
  const dbName = `idx_test_${uuid4().replace(/-/g, "_")}`;

  runGenericKvRepositoryTests(
    async (keyType, valueType) => new IndexedDbKvRepository(`${dbName}`, keyType, valueType)
  );
});
