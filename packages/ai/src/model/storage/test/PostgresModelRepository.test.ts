//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresModelRepository } from "../PostgresModelRepository";
import { runGenericModelRepositoryTests } from "./genericModelRepositoryTests";
import { nanoid } from "nanoid";
import { describe } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";

const db = new PGlite() as unknown as Pool;

async function createPostgresModelRepository() {
  const id = nanoid();
  return new PostgresModelRepository(db, `aimodel_test_${id}`, `aitask2aimodel_test_${id}`);
}

describe("PostgresModelRepository", () => {
  runGenericModelRepositoryTests(createPostgresModelRepository);
});
