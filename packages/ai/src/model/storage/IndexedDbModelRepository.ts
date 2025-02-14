//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueType, IndexedDbKVRepository } from "@ellmers/storage";
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
  modelKvRepository: IndexedDbKVRepository<
    ModelPrimaryKey,
    DefaultValueType,
    typeof ModelPrimaryKeySchema
  >;
  task2ModelKvRepository: IndexedDbKVRepository<
    Task2ModelPrimaryKey,
    Task2ModelDetail,
    typeof Task2ModelPrimaryKeySchema,
    typeof Task2ModelDetailSchema
  >;
  public type = "IndexedDbModelRepository" as const;

  constructor(tableModels: string = "models", tableTask2Models: string = "task2models") {
    super();
    this.modelKvRepository = new IndexedDbKVRepository<
      ModelPrimaryKey,
      DefaultValueType,
      typeof ModelPrimaryKeySchema
    >(tableModels, ModelPrimaryKeySchema);
    this.task2ModelKvRepository = new IndexedDbKVRepository<
      Task2ModelPrimaryKey,
      Task2ModelDetail,
      typeof Task2ModelPrimaryKeySchema,
      typeof Task2ModelDetailSchema
    >(tableTask2Models, Task2ModelPrimaryKeySchema, Task2ModelDetailSchema, ["model"]);
  }
}
