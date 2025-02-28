//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteTabularRepository } from "@ellmers/storage";
import {
  ModelRepository,
  ModelSchema,
  ModelPrimaryKeyNames,
  Task2ModelPrimaryKeyNames,
  Task2ModelSchema,
} from "../ModelRepository";

/**
 * SQLite implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings using SQLite.
 */
export class SqliteModelRepository extends ModelRepository {
  public type = "SqliteModelRepository" as const;
  modelTabularRepository: SqliteTabularRepository<typeof ModelSchema, typeof ModelPrimaryKeyNames>;
  task2ModelTabularRepository: SqliteTabularRepository<
    typeof Task2ModelSchema,
    typeof Task2ModelPrimaryKeyNames
  >;
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
    this.task2ModelTabularRepository = new SqliteTabularRepository(
      dbOrPath,
      tableTask2Models,
      Task2ModelSchema,
      Task2ModelPrimaryKeyNames,
      ["model"]
    );
  }
}
