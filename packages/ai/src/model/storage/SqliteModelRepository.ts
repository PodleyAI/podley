//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueType, SqliteKVRepository } from "@ellmers/storage";
import {
  Task2ModelDetailSchema,
  Task2ModelPrimaryKeySchema,
  Task2ModelDetail,
  Task2ModelPrimaryKey,
  ModelRepository,
} from "../ModelRepository";
import { ModelPrimaryKey, ModelPrimaryKeySchema } from "../Model";

/**
 * SQLite implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings using SQLite.
 */
export class SqliteModelRepository extends ModelRepository {
  public type = "SqliteModelRepository" as const;
  modelKvRepository: SqliteKVRepository<
    ModelPrimaryKey,
    DefaultValueType,
    typeof ModelPrimaryKeySchema
  >;
  task2ModelKvRepository: SqliteKVRepository<
    Task2ModelPrimaryKey,
    Task2ModelDetail,
    typeof Task2ModelPrimaryKeySchema,
    typeof Task2ModelDetailSchema
  >;
  constructor(
    dbOrPath: string,
    tableModels: string = "aimodel",
    tableTask2Models: string = "aitask2aimodel"
  ) {
    super();
    this.modelKvRepository = new SqliteKVRepository<
      ModelPrimaryKey,
      DefaultValueType,
      typeof ModelPrimaryKeySchema
    >(dbOrPath, tableModels, ModelPrimaryKeySchema);
    this.task2ModelKvRepository = new SqliteKVRepository<
      Task2ModelPrimaryKey,
      Task2ModelDetail,
      typeof Task2ModelPrimaryKeySchema,
      typeof Task2ModelDetailSchema
    >(dbOrPath, tableTask2Models, Task2ModelPrimaryKeySchema, Task2ModelDetailSchema);
  }
}
