/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryTabularRepository } from "@podley/storage";
import {
  ModelPrimaryKeyNames,
  ModelRepository,
  ModelSchema,
  Task2ModelPrimaryKeyNames,
  Task2ModelSchema,
} from "../ModelRepository";

/**
 * In-memory implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings.
 */
export class InMemoryModelRepository extends ModelRepository {
  modelTabularRepository: InMemoryTabularRepository<
    typeof ModelSchema,
    typeof ModelPrimaryKeyNames
  >;
  task2ModelTabularRepository: InMemoryTabularRepository<
    typeof Task2ModelSchema,
    typeof Task2ModelPrimaryKeyNames
  >;
  public type = "InMemoryModelRepository" as const;
  constructor() {
    super();
    this.modelTabularRepository = new InMemoryTabularRepository(ModelSchema, ModelPrimaryKeyNames);
    this.task2ModelTabularRepository = new InMemoryTabularRepository(
      Task2ModelSchema,
      Task2ModelPrimaryKeyNames,
      ["model"]
    );
  }
}
