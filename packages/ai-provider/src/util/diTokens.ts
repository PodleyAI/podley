//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@ellmers/util";

// Define a registry token that can be used to get providers by name
export interface AIProviderRegistry {
  getProvider(name: string): any;
  registerProvider(name: string, provider: any): void;
  hasProvider(name: string): boolean;
}

export const AI_PROVIDER_REGISTRY = createServiceToken<AIProviderRegistry>("aiprovider.registry");
