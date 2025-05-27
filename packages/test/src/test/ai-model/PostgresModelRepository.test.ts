//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresModelRepository } from "@podley/ai";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests.test";
import { uuid4 } from "@podley/util";
import { describe } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";

const db = new PGlite() as unknown as Pool;

async function createPostgresModelRepository() {
  const id = uuid4().replace(/-/g, "_");
  return new PostgresModelRepository(db, `aimodel_test_${id}`, `aitask2aimodel_test_${id}`);
}

describe("PostgresModelRepository", () => {
  runGenericModelRepositoryTests(createPostgresModelRepository);
});
