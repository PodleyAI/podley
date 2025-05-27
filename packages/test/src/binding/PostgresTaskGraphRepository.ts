//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskGraphTabularRepository,
  TaskGraphSchema,
  TaskGraphPrimaryKeyNames,
} from "@podley/task-graph";
import { PostgresTabularRepository } from "@podley/storage";
import type { Pool } from "pg";
import { createServiceToken } from "@podley/util";

export const POSTGRES_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphTabularRepository>(
  "taskgraph.taskGraphRepository.postgres"
);

/**
 * PostgreSQL implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using PostgreSQL.
 */
export class PostgresTaskGraphRepository extends TaskGraphTabularRepository {
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
