//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskGraphRepository,
  TaskGraphSchema,
  TaskGraphPrimaryKeyNames,
} from "@ellmers/task-graph";
import { InMemoryTabularRepository } from "@ellmers/storage";
import { createServiceToken } from "@ellmers/util";

export const MEMORY_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository.inMemory"
);

/**
 * In-memory implementation of a task graph repository.
 * Provides storage and retrieval for task graphs.
 */
export class InMemoryTaskGraphRepository extends TaskGraphRepository {
  constructor() {
    super({
      tabularRepository: new InMemoryTabularRepository(TaskGraphSchema, TaskGraphPrimaryKeyNames),
    });
  }
}
