/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, globalServiceRegistry } from "@workglow/util";
import { InMemoryModelRepository } from "./InMemoryModelRepository";
import { ModelRepository } from "./ModelRepository";

/**
 * Service token for the global model repository
 */
export const MODEL_REPOSITORY = createServiceToken<ModelRepository>("model.repository");

// Register default factory if not already registered
if (!globalServiceRegistry.has(MODEL_REPOSITORY)) {
  globalServiceRegistry.register(
    MODEL_REPOSITORY,
    (): ModelRepository => new InMemoryModelRepository(),
    true
  );
}

/**
 * Gets the global model repository instance
 * @returns The model repository instance
 */
export function getGlobalModelRepository(): ModelRepository {
  return globalServiceRegistry.get(MODEL_REPOSITORY);
}

/**
 * Sets the global model repository instance
 * @param pr The model repository instance to register
 */
export function setGlobalModelRepository(pr: ModelRepository): void {
  globalServiceRegistry.registerInstance(MODEL_REPOSITORY, pr);
}
