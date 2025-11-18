/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelRepository } from "./ModelRepository";
import { InMemoryModelRepository } from "./storage/InMemoryModelRepository";

// temporary model registry that is synchronous until we have a proper model repository

class FallbackModelRegistry extends InMemoryModelRepository {}

let modelRegistry: ModelRepository;
export function getGlobalModelRepository() {
  if (!modelRegistry) modelRegistry = new FallbackModelRegistry();
  return modelRegistry;
}
export function setGlobalModelRepository(pr: ModelRepository) {
  modelRegistry = pr;
}
