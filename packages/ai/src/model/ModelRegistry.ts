/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryModelRepository } from "./InMemoryModelRepository";
import { ModelRepository } from "./ModelRepository";

let modelRegistry: ModelRepository;
export function getGlobalModelRepository(): ModelRepository {
  if (!modelRegistry) modelRegistry = new InMemoryModelRepository();
  return modelRegistry;
}
export function setGlobalModelRepository(pr: ModelRepository) {
  modelRegistry = pr;
}
