//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresTabularRepository } from "@podley/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputTabularRepository,
} from "@podley/task-graph";
import type { Pool } from "pg";
import { createServiceToken } from "@podley/util";

export const POSTGRES_TASK_OUTPUT_REPOSITORY = createServiceToken<PostgresTaskOutputRepository>(
  "taskgraph.taskOutputRepository.postgres"
);

/**
 * PostgreSQL implementation of a task output repository.
 * Provides storage and retrieval for task outputs using PostgreSQL.
 */
export class PostgresTaskOutputRepository extends TaskOutputTabularRepository {
  constructor(db: Pool, table: string = "task_outputs") {
    super({
      tabularRepository: new PostgresTabularRepository(
        db,
        table,
        TaskOutputSchema,
        TaskOutputPrimaryKeyNames,
        ["createdAt"]
      ),
    });
  }
}
