//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DefaultValueType, IndexedDbTabularRepository } from "@ellmers/storage";
import {
  TaskOutputPrimaryKey,
  TaskOutputPrimaryKeySchema,
  TaskOutputRepository,
} from "./TaskOutputRepository";

/**
 * IndexedDB implementation of a task output repository.
 * Provides storage and retrieval for task outputs using IndexedDB.
 */
export class IndexedDbTaskOutputRepository extends TaskOutputRepository {
  tabularRepository: IndexedDbTabularRepository<
    TaskOutputPrimaryKey,
    DefaultValueType,
    typeof TaskOutputPrimaryKeySchema
  >;
  public type = "IndexedDbTaskOutputRepository" as const;
  constructor(table: string = "task_outputs") {
    super();
    this.tabularRepository = new IndexedDbTabularRepository<
      TaskOutputPrimaryKey,
      DefaultValueType,
      typeof TaskOutputPrimaryKeySchema
    >(table, TaskOutputPrimaryKeySchema);
  }
}
