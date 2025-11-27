/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { PostgresTabularRepository } from "@workglow/storage";
import { Pool } from "pg";
import {
    ModelPrimaryKeyNames,
    ModelRepository,
    ModelSchema,
    Task2ModelPrimaryKeyNames,
    Task2ModelSchema,
} from "../ModelRepository";

/**
 * PostgreSQL implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings using PostgreSQL.
 */
export class PostgresModelRepository extends ModelRepository {
  public type = "PostgresModelRepository" as const;
  modelTabularRepository: PostgresTabularRepository<
    typeof ModelSchema,
    typeof ModelPrimaryKeyNames
  >;
  task2ModelTabularRepository: PostgresTabularRepository<
    typeof Task2ModelSchema,
    typeof Task2ModelPrimaryKeyNames
  >;

  constructor(
    db: Pool,
    tableModels: string = "aimodel",
    tableTask2Models: string = "aitask2aimodel"
  ) {
    super();
    this.modelTabularRepository = new PostgresTabularRepository(
      db,
      tableModels,
      ModelSchema,
      ModelPrimaryKeyNames
    );
    this.task2ModelTabularRepository = new PostgresTabularRepository(
      db,
      tableTask2Models,
      Task2ModelSchema,
      Task2ModelPrimaryKeyNames,
      ["model"]
    );
  }
}
