/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { PGlite } from "@electric-sql/pglite";
import { PostgresModelRepository } from "@podley/ai";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import { Pool } from "pg";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests.test";

const db = new PGlite() as unknown as Pool;

async function createPostgresModelRepository() {
  const id = uuid4().replace(/-/g, "_");
  return new PostgresModelRepository(db, `aimodel_test_${id}`, `aitask2aimodel_test_${id}`);
}

describe("PostgresModelRepository", () => {
  runGenericModelRepositoryTests(createPostgresModelRepository);
});
