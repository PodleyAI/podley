//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraphRepository } from "./TaskGraphRepository";
import {
  DefaultPrimaryKeySchema,
  DefaultPrimaryKeyType,
  DefaultValueSchema,
  DefaultValueType,
  SqliteTabularRepository,
} from "@ellmers/storage";

/**
 * SQLite implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using SQLite.
 */
export class SqliteTaskGraphRepository extends TaskGraphRepository {
  tabularRepository: SqliteTabularRepository<
    DefaultPrimaryKeyType,
    DefaultValueType,
    typeof DefaultPrimaryKeySchema,
    typeof DefaultValueSchema
  >;
  public type = "SqliteTaskGraphRepository" as const;
  constructor(dbOrPath: string, table: string = "task_graphs") {
    super();
    this.tabularRepository = new SqliteTabularRepository(
      dbOrPath,
      table,
      DefaultPrimaryKeySchema,
      DefaultValueSchema
    );
  }
}
