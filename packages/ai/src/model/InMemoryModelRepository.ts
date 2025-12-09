/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryTabularRepository } from "@workglow/storage";
import { ModelRepository } from "./ModelRepository";
import { ModelPrimaryKeyNames, ModelSchema } from "./ModelSchema";

/**
 * In-memory implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings.
 */
export class InMemoryModelRepository extends ModelRepository {
  modelTabularRepository: InMemoryTabularRepository<
    typeof ModelSchema,
    typeof ModelPrimaryKeyNames
  >;
  public type = "InMemoryModelRepository" as const;
  constructor() {
    super();
    this.modelTabularRepository = new InMemoryTabularRepository(ModelSchema, ModelPrimaryKeyNames);
  }
}
