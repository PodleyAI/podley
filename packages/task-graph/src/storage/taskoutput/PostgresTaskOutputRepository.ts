//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueType, PostgresTabularRepository } from "@ellmers/storage";
import type { Pool } from "pg";
import {
  TaskOutputPrimaryKey,
  TaskOutputPrimaryKeySchema,
  TaskOutputRepository,
} from "./TaskOutputRepository";

/**
 * PostgreSQL implementation of a task output repository.
 * Provides storage and retrieval for task outputs using PostgreSQL.
 */
export class PostgresTaskOutputRepository extends TaskOutputRepository {
  tabularRepository: PostgresTabularRepository<
    TaskOutputPrimaryKey,
    DefaultValueType,
    typeof TaskOutputPrimaryKeySchema
  >;
  public type = "PostgresTaskOutputRepository" as const;
  constructor(db: Pool) {
    super();
    this.tabularRepository = new PostgresTabularRepository<
      TaskOutputPrimaryKey,
      DefaultValueType,
      typeof TaskOutputPrimaryKeySchema
    >(db, "task_outputs", TaskOutputPrimaryKeySchema);
  }
}
