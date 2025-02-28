//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueSchema, DefaultValueType, InMemoryTabularRepository } from "@ellmers/storage";
import {
  Task2ModelDetailSchema,
  Task2ModelPrimaryKeySchema,
  Task2ModelDetail,
  Task2ModelPrimaryKey,
  ModelRepository,
} from "../ModelRepository";
import { ModelPrimaryKey, ModelPrimaryKeySchema } from "../Model";

/**
 * In-memory implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings.
 */
export class InMemoryModelRepository extends ModelRepository {
  modelTabularRepository: InMemoryTabularRepository<
    ModelPrimaryKey,
    DefaultValueType,
    typeof ModelPrimaryKeySchema,
    typeof DefaultValueSchema
  >;
  task2ModelTabularRepository: InMemoryTabularRepository<
    Task2ModelPrimaryKey,
    Task2ModelDetail,
    typeof Task2ModelPrimaryKeySchema,
    typeof Task2ModelDetailSchema
  >;
  public type = "InMemoryModelRepository" as const;
  constructor() {
    super();
    this.modelTabularRepository = new InMemoryTabularRepository<
      ModelPrimaryKey,
      DefaultValueType,
      typeof ModelPrimaryKeySchema,
      typeof DefaultValueSchema
    >(ModelPrimaryKeySchema, DefaultValueSchema);
    this.task2ModelTabularRepository = new InMemoryTabularRepository<
      Task2ModelPrimaryKey,
      Task2ModelDetail,
      typeof Task2ModelPrimaryKeySchema,
      typeof Task2ModelDetailSchema
    >(Task2ModelPrimaryKeySchema, Task2ModelDetailSchema, ["model"]);
  }
}
