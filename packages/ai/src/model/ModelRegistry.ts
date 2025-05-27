//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

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
