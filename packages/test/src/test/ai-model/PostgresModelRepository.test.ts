/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { PGlite } from "@electric-sql/pglite";
import { PostgresModelRepository } from "@workglow/ai";
import { uuid4 } from "@workglow/util";
import { Pool } from "pg";
import { describe } from "vitest";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests";

const db = new PGlite() as unknown as Pool;

async function createPostgresModelRepository() {
  const id = uuid4().replace(/-/g, "_");
  return new PostgresModelRepository(db, `aimodel_test_${id}`, `aitask2aimodel_test_${id}`);
}

describe("PostgresModelRepository", () => {
  runGenericModelRepositoryTests(createPostgresModelRepository);
});
