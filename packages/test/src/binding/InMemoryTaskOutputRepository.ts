//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryTabularRepository } from "@ellmers/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputRepository,
} from "@ellmers/task-graph";

/**
 * In-memory implementation of a task output repository.
 * Provides storage and retrieval for task outputs.
 */
export class InMemoryTaskOutputRepository extends TaskOutputRepository {
  constructor() {
    super({
      tabularRepository: new InMemoryTabularRepository(TaskOutputSchema, TaskOutputPrimaryKeyNames),
    });
  }
}
