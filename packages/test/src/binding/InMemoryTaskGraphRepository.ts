//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskGraphTabularRepository,
  TaskGraphSchema,
  TaskGraphPrimaryKeyNames,
} from "@podley/task-graph";
import { InMemoryTabularRepository } from "@podley/storage";
import { createServiceToken } from "@podley/util";

export const MEMORY_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphTabularRepository>(
  "taskgraph.taskGraphRepository.inMemory"
);

/**
 * In-memory implementation of a task graph repository.
 * Provides storage and retrieval for task graphs.
 */
export class InMemoryTaskGraphRepository extends TaskGraphTabularRepository {
  constructor() {
    super({
      tabularRepository: new InMemoryTabularRepository(TaskGraphSchema, TaskGraphPrimaryKeyNames),
    });
  }
}
