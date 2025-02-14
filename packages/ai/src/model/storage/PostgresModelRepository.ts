//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueType, PostgresKVRepository } from "@ellmers/storage";
import {
  Task2ModelDetailSchema,
  Task2ModelPrimaryKeySchema,
  Task2ModelDetail,
  Task2ModelPrimaryKey,
  ModelRepository,
} from "../ModelRepository";
import { ModelPrimaryKey, ModelPrimaryKeySchema } from "../Model";
import { Pool } from "pg";

/**
 * PostgreSQL implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings using PostgreSQL.
 */
export class PostgresModelRepository extends ModelRepository {
  public type = "PostgresModelRepository" as const;
  modelKvRepository: PostgresKVRepository<
    ModelPrimaryKey,
    DefaultValueType,
    typeof ModelPrimaryKeySchema
  >;
  task2ModelKvRepository: PostgresKVRepository<
    Task2ModelPrimaryKey,
    Task2ModelDetail,
    typeof Task2ModelPrimaryKeySchema,
    typeof Task2ModelDetailSchema
  >;

  constructor(
    db: Pool,
    tableModels: string = "aimodel",
    tableTask2Models: string = "aitask2aimodel"
  ) {
    super();
    this.modelKvRepository = new PostgresKVRepository<
      ModelPrimaryKey,
      DefaultValueType,
      typeof ModelPrimaryKeySchema
    >(db, tableModels, ModelPrimaryKeySchema);
    this.task2ModelKvRepository = new PostgresKVRepository<
      Task2ModelPrimaryKey,
      Task2ModelDetail,
      typeof Task2ModelPrimaryKeySchema,
      typeof Task2ModelDetailSchema
    >(db, tableTask2Models, Task2ModelPrimaryKeySchema, Task2ModelDetailSchema);
  }
}
