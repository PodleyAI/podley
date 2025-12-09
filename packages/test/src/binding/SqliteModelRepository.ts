/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelPrimaryKeyNames, ModelRepository, ModelSchema } from "@workglow/ai";
import { SqliteTabularRepository } from "@workglow/storage";

/**
 * SQLite implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings using SQLite.
 */
export class SqliteModelRepository extends ModelRepository {
  public type = "SqliteModelRepository" as const;
  modelTabularRepository: SqliteTabularRepository<typeof ModelSchema, typeof ModelPrimaryKeyNames>;
  constructor(
    dbOrPath: string,
    tableModels: string = "aimodel",
    tableTask2Models: string = "aitask2aimodel"
  ) {
    super();
    this.modelTabularRepository = new SqliteTabularRepository(
      dbOrPath,
      tableModels,
      ModelSchema,
      ModelPrimaryKeyNames
    );
  }
}
