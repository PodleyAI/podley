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
import { SqliteTabularRepository } from "@podley/storage";
import { createServiceToken } from "@podley/util";

export const SQLITE_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphTabularRepository>(
  "taskgraph.taskGraphRepository.sqlite"
);

/**
 * SQLite implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using SQLite.
 */
export class SqliteTaskGraphRepository extends TaskGraphTabularRepository {
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
