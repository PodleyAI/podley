//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteTabularRepository } from "@podley/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputTabularRepository,
} from "@podley/task-graph";
import { createServiceToken } from "@podley/util";

export const SQLITE_TASK_OUTPUT_REPOSITORY = createServiceToken<SqliteTaskOutputRepository>(
  "taskgraph.taskOutputRepository.sqlite"
);

/**
 * SQLite implementation of a task output repository.
 * Provides storage and retrieval for task outputs using SQLite.
 */
export class SqliteTaskOutputRepository extends TaskOutputTabularRepository {
  constructor(dbOrPath: string, table: string = "task_outputs") {
    super({
      tabularRepository: new SqliteTabularRepository(
        dbOrPath,
        table,
        TaskOutputSchema,
        TaskOutputPrimaryKeyNames,
        ["createdAt"]
      ),
    });
  }
}
