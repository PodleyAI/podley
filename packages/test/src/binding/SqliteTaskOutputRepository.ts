//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SqliteTabularRepository } from "@ellmers/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputRepository,
} from "@ellmers/task-graph";
import { createServiceToken } from "@ellmers/util";

export const SQLITE_TASK_OUTPUT_REPOSITORY = createServiceToken<TaskOutputRepository>(
  "taskgraph.taskOutputRepository.sqlite"
);

/**
 * SQLite implementation of a task output repository.
 * Provides storage and retrieval for task outputs using SQLite.
 */
export class SqliteTaskOutputRepository extends TaskOutputRepository {
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
