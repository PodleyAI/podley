//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskGraphPrimaryKeyNames,
  TaskGraphTabularRepository,
  TaskGraphSchema,
} from "@podley/task-graph";
import { IndexedDbTabularRepository } from "@podley/storage";
import { createServiceToken } from "@podley/util";

export const IDB_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphTabularRepository>(
  "taskgraph.taskGraphRepository.indexedDb"
);

/**
 * IndexedDB implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using IndexedDB.
 */
export class IndexedDbTaskGraphRepository extends TaskGraphTabularRepository {
  constructor(table: string = "task_graphs") {
    super({
      tabularRepository: new IndexedDbTabularRepository(
        table,
        TaskGraphSchema,
        TaskGraphPrimaryKeyNames
      ),
    });
  }
}
