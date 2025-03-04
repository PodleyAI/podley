//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { serviceRegistry } from "@ellmers/util";
import { TASK_OUTPUT_REPOSITORY, TASK_GRAPH_REPOSITORY } from "./diTokens";

/**
 * Register a custom task output repository
 * @param repository The repository implementation to use
 */
export function registerTaskOutputRepository(
  repository: typeof TASK_OUTPUT_REPOSITORY._type
): void {
  serviceRegistry.registerInstance(TASK_OUTPUT_REPOSITORY, repository);
}

/**
 * Register a custom task graph repository
 * @param repository The repository implementation to use
 */
export function registerTaskGraphRepository(repository: typeof TASK_GRAPH_REPOSITORY._type): void {
  serviceRegistry.registerInstance(TASK_GRAPH_REPOSITORY, repository);
}

/**
 * Get the registered task output repository
 * @returns The registered task output repository
 */
export function getTaskOutputRepository(): typeof TASK_OUTPUT_REPOSITORY._type {
  return serviceRegistry.get(TASK_OUTPUT_REPOSITORY);
}

/**
 * Get the registered task graph repository
 * @returns The registered task graph repository
 */
export function getTaskGraphRepository(): typeof TASK_GRAPH_REPOSITORY._type {
  return serviceRegistry.get(TASK_GRAPH_REPOSITORY);
}
