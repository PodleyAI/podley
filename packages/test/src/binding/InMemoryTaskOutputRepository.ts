//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { InMemoryTabularRepository } from "@podley/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
  TaskOutputTabularRepository,
} from "@podley/task-graph";
import { createServiceToken } from "@podley/util";

export const MEMORY_TASK_OUTPUT_REPOSITORY = createServiceToken<InMemoryTaskOutputRepository>(
  "taskgraph.taskOutputRepository.inMemory"
);

/**
 * In-memory implementation of a task output repository.
 * Provides storage and retrieval for task outputs.
 */
export class InMemoryTaskOutputRepository extends TaskOutputTabularRepository {
  constructor() {
    super({
      tabularRepository: new InMemoryTabularRepository(
        TaskOutputSchema,
        TaskOutputPrimaryKeyNames,
        ["createdAt"]
      ),
    });
  }
}
