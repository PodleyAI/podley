/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelPrimaryKeyNames, ModelRepository, ModelSchema } from "@workglow/ai";
import { PostgresTabularRepository } from "@workglow/storage";
import { Pool } from "pg";

/**
 * PostgreSQL implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings using PostgreSQL.
 */
export class PostgresModelRepository extends ModelRepository {
  constructor(db: Pool, tableModels: string = "aimodel") {
    super(new PostgresTabularRepository(db, tableModels, ModelSchema, ModelPrimaryKeyNames));
  }
}
