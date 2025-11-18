/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryModelRepository } from "@podley/ai";
import { describe } from "bun:test";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests.test";

describe("InMemoryModelRepository", () => {
  runGenericModelRepositoryTests(async () => new InMemoryModelRepository());
});
