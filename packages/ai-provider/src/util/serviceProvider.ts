//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { serviceRegistry } from "@ellmers/util";
import { AIProviderRegistry, AI_PROVIDER_REGISTRY } from "./diTokens";

/**
 * Get the AI provider registry
 */
export function getAIProviderRegistry(): AIProviderRegistry {
  return serviceRegistry.get(AI_PROVIDER_REGISTRY);
}

/**
 * Helper to get a provider by name
 * @param name Provider name
 * @returns The provider instance or undefined if not found
 */
export function getProviderByName(name: string): any {
  const registry = getAIProviderRegistry();
  return registry.getProvider(name);
}
