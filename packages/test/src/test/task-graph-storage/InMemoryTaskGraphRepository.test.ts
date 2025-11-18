/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe } from "bun:test";
import { InMemoryTaskGraphRepository } from "../../binding/InMemoryTaskGraphRepository";
import { runGenericTaskGraphRepositoryTests } from "./genericTaskGraphRepositoryTests";

describe("InMemoryTaskGraphRepository", () => {
  runGenericTaskGraphRepositoryTests(async () => new InMemoryTaskGraphRepository());
});
