//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueSchema, DefaultValueType, IndexedDbTabularRepository } from "@ellmers/storage";
import {
  Task2ModelDetailSchema,
  Task2ModelPrimaryKeySchema,
  Task2ModelDetail,
  Task2ModelPrimaryKey,
  ModelRepository,
} from "../ModelRepository";
import { ModelPrimaryKey, ModelPrimaryKeySchema } from "../Model";

/**
 * IndexedDB implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings.
 */
export class IndexedDbModelRepository extends ModelRepository {
  modelTabularRepository: IndexedDbTabularRepository<
    ModelPrimaryKey,
    DefaultValueType,
    typeof ModelPrimaryKeySchema,
    typeof DefaultValueSchema
  >;
  task2ModelTabularRepository: IndexedDbTabularRepository<
    Task2ModelPrimaryKey,
    Task2ModelDetail,
    typeof Task2ModelPrimaryKeySchema,
    typeof Task2ModelDetailSchema
  >;
  public type = "IndexedDbModelRepository" as const;

  constructor(tableModels: string = "models", tableTask2Models: string = "task2models") {
    super();
    this.modelTabularRepository = new IndexedDbTabularRepository<
      ModelPrimaryKey,
      DefaultValueType,
      typeof ModelPrimaryKeySchema,
      typeof DefaultValueSchema
    >(tableModels, ModelPrimaryKeySchema, DefaultValueSchema);
    this.task2ModelTabularRepository = new IndexedDbTabularRepository<
      Task2ModelPrimaryKey,
      Task2ModelDetail,
      typeof Task2ModelPrimaryKeySchema,
      typeof Task2ModelDetailSchema
    >(tableTask2Models, Task2ModelPrimaryKeySchema, Task2ModelDetailSchema, ["model"]);
  }
}
