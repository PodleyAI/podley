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
import { SqliteTabularRepository } from "@ellmers/storage";
import { createServiceToken } from "@ellmers/util";

export const SQLITE_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository.sqlite"
);

/**
 * SQLite implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using SQLite.
 */
export class SqliteTaskGraphRepository extends TaskGraphRepository {
  constructor(dbOrPath: string, table: string = "task_graphs") {
    super({
      tabularRepository: new SqliteTabularRepository(
        dbOrPath,
        table,
        TaskGraphSchema,
        TaskGraphPrimaryKeyNames
      ),
    });
  }
}
