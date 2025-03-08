//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresTabularRepository } from "@ellmers/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputRepository,
} from "@ellmers/task-graph";
import type { Pool } from "pg";

/**
 * PostgreSQL implementation of a task output repository.
 * Provides storage and retrieval for task outputs using PostgreSQL.
 */
export class PostgresTaskOutputRepository extends TaskOutputRepository {
  tabularRepository: PostgresTabularRepository<
    typeof TaskOutputSchema,
    typeof TaskOutputPrimaryKeyNames
  >;
  public type = "PostgresTaskOutputRepository" as const;
  constructor(db: Pool, table: string = "task_outputs") {
    super();
    this.tabularRepository = new PostgresTabularRepository(
      db,
      table,
      TaskOutputSchema,
      TaskOutputPrimaryKeyNames
    );
  }
}
