/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDbTabularRepository } from "@workglow/storage";
import {
    ModelPrimaryKeyNames,
    ModelRepository,
    ModelSchema,
    Task2ModelPrimaryKeyNames,
    Task2ModelSchema,
} from "../ModelRepository";

/**
 * IndexedDB implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings.
 */
export class IndexedDbModelRepository extends ModelRepository {
  modelTabularRepository: IndexedDbTabularRepository<
    typeof ModelSchema,
    typeof ModelPrimaryKeyNames
  >;
  task2ModelTabularRepository: IndexedDbTabularRepository<
    typeof Task2ModelSchema,
    typeof Task2ModelPrimaryKeyNames
  >;
  public type = "IndexedDbModelRepository" as const;

  constructor(tableModels: string = "models", tableTask2Models: string = "task2models") {
    super();
    this.modelTabularRepository = new IndexedDbTabularRepository(
      tableModels,
      ModelSchema,
      ModelPrimaryKeyNames
    );
    this.task2ModelTabularRepository = new IndexedDbTabularRepository(
      tableTask2Models,
      Task2ModelSchema,
      Task2ModelPrimaryKeyNames,
      ["model"]
    );
  }
}
