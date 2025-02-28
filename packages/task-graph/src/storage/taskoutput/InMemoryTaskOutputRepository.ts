//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueSchema, DefaultValueType, InMemoryTabularRepository } from "@ellmers/storage";
import { TaskOutputPrimaryKeySchema } from "./TaskOutputRepository";
import { TaskOutputPrimaryKey } from "./TaskOutputRepository";
import { TaskOutputRepository } from "./TaskOutputRepository";

/**
 * In-memory implementation of a task output repository.
 * Provides storage and retrieval for task outputs.
 */
export class InMemoryTaskOutputRepository extends TaskOutputRepository {
  tabularRepository: InMemoryTabularRepository<
    TaskOutputPrimaryKey,
    DefaultValueType,
    typeof TaskOutputPrimaryKeySchema,
    typeof DefaultValueSchema
  >;
  public type = "InMemoryTaskOutputRepository" as const;
  constructor() {
    super();
    this.tabularRepository = new InMemoryTabularRepository<
      TaskOutputPrimaryKey,
      DefaultValueType,
      typeof TaskOutputPrimaryKeySchema,
      typeof DefaultValueSchema
    >(TaskOutputPrimaryKeySchema, DefaultValueSchema);
  }
}
