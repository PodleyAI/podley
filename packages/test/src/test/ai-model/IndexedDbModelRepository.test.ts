/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDbModelRepository } from "@podley/ai";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import "fake-indexeddb/auto";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests.test";

describe("IndexedDbModelRepository", () => {
  runGenericModelRepositoryTests(async () => {
    const id = uuid4().replace(/-/g, "_");
    const modelDbName = `idx_model_test_${id}`;
    const task2modelDbName = `idx_task2model_test_${id}`;
    return new IndexedDbModelRepository(modelDbName, task2modelDbName);
  });
});
