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
import { PostgresTabularRepository } from "@ellmers/storage";
import type { Pool } from "pg";

/**
 * PostgreSQL implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using PostgreSQL.
 */
export class PostgresTaskGraphRepository extends TaskGraphRepository {
  constructor(db: Pool, table: string = "task_graphs") {
    super({
      tabularRepository: new PostgresTabularRepository(
        db,
        table,
        TaskGraphSchema,
        TaskGraphPrimaryKeyNames
      ),
    });
  }
}
