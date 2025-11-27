/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { SqliteKvRepository } from "@workglow/storage";
import { uuid4 } from "@workglow/util";
import { describe } from "vitest";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

describe("SqliteKvRepository", () => {
  runGenericKvRepositoryTests(
    async (keyType, valueType) =>
      new SqliteKvRepository(
        ":memory:",
        `sql_test_${uuid4().replace(/-/g, "_")}`,
        keyType,
        valueType
      )
  );
});
