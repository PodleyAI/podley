//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskGraphPrimaryKeyNames,
  TaskGraphRepository,
  TaskGraphSchema,
} from "@ellmers/task-graph";
import { IndexedDbTabularRepository } from "@ellmers/storage";
import { createServiceToken } from "@ellmers/util";

export const IDB_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository.indexedDb"
);

/**
 * IndexedDB implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using IndexedDB.
 */
export class IndexedDbTaskGraphRepository extends TaskGraphRepository {
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
