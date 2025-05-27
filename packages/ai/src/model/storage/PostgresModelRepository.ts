//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { PostgresTabularRepository } from "@podley/storage";
import {
  ModelRepository,
  ModelSchema,
  ModelPrimaryKeyNames,
  Task2ModelPrimaryKeyNames,
  Task2ModelSchema,
} from "../ModelRepository";
import { Pool } from "pg";

/**
 * PostgreSQL implementation of a model repository.
 * Provides storage and retrieval for models and task-to-model mappings using PostgreSQL.
 */
export class PostgresModelRepository extends ModelRepository {
  public type = "PostgresModelRepository" as const;
  modelTabularRepository: PostgresTabularRepository<
    typeof ModelSchema,
    typeof ModelPrimaryKeyNames
  >;
  task2ModelTabularRepository: PostgresTabularRepository<
    typeof Task2ModelSchema,
    typeof Task2ModelPrimaryKeyNames
  >;

  constructor(
    db: Pool,
    tableModels: string = "aimodel",
    tableTask2Models: string = "aitask2aimodel"
  ) {
    super();
    this.modelTabularRepository = new PostgresTabularRepository(
      db,
      tableModels,
      ModelSchema,
      ModelPrimaryKeyNames
    );
    this.task2ModelTabularRepository = new PostgresTabularRepository(
      db,
      tableTask2Models,
      Task2ModelSchema,
      Task2ModelPrimaryKeyNames,
      ["model"]
    );
  }
}
