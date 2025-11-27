/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryKvRepository } from "@workglow/storage";
import { describe } from "vitest";
import { runGenericKvRepositoryTests } from "./genericKvRepositoryTests";

describe("InMemoryKvRepository", () => {
  runGenericKvRepositoryTests(
    async (keyType, valueType) => new InMemoryKvRepository(keyType, valueType)
  );
});
