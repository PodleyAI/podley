/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import { SqliteTaskOutputRepository } from "../../binding/SqliteTaskOutputRepository";
import { runGenericTaskOutputRepositoryTests } from "./genericTaskOutputRepositoryTests";

describe("SqliteTaskOutputRepository", () => {
  runGenericTaskOutputRepositoryTests(async () => {
    const id = uuid4().replace(/-/g, "_");
    const dbName = `task_output_test_${id}`;
    return new SqliteTaskOutputRepository(":memory:", dbName);
  });
});
