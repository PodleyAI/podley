//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IndexedDbTabularRepository } from "@ellmers/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputTabularRepository,
} from "@ellmers/task-graph";
import { createServiceToken } from "@ellmers/util";

export const IDB_TASK_OUTPUT_REPOSITORY = createServiceToken<IndexedDbTaskOutputRepository>(
  "taskgraph.taskOutputRepository.indexedDb"
);

/**
 * IndexedDB implementation of a task output repository.
 * Provides storage and retrieval for task outputs using IndexedDB.
 */
export class IndexedDbTaskOutputRepository extends TaskOutputTabularRepository {
  constructor(table: string = "task_outputs") {
    super({
      tabularRepository: new IndexedDbTabularRepository(
        table,
        TaskOutputSchema,
        TaskOutputPrimaryKeyNames,
        ["createdAt"]
      ),
    });
  }
}
