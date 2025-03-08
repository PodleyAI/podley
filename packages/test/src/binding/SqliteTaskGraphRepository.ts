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

/**
 * SQLite implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using SQLite.
 */
export class SqliteTaskGraphRepository extends TaskGraphRepository {
  tabularRepository: SqliteTabularRepository<
    typeof TaskGraphSchema,
    typeof TaskGraphPrimaryKeyNames
  >;
  public type = "SqliteTaskGraphRepository" as const;
  constructor(dbOrPath: string, table: string = "task_graphs") {
    super();
    this.tabularRepository = new SqliteTabularRepository(
      dbOrPath,
      table,
      TaskGraphSchema,
      TaskGraphPrimaryKeyNames
    );
  }
}
