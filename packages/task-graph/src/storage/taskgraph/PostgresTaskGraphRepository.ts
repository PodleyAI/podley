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
} from "./TaskGraphRepository";
import { PostgresTabularRepository } from "@ellmers/storage";
import type { Pool } from "pg";

/**
 * PostgreSQL implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using PostgreSQL.
 */
export class PostgresTaskGraphRepository extends TaskGraphRepository {
  tabularRepository: PostgresTabularRepository<
    typeof TaskGraphSchema,
    typeof TaskGraphPrimaryKeyNames
  >;
  public type = "PostgresTaskGraphRepository" as const;
  constructor(db: Pool) {
    super();
    this.tabularRepository = new PostgresTabularRepository(
      db,
      "task_graphs",
      TaskGraphSchema,
      TaskGraphPrimaryKeyNames
    );
  }
}
