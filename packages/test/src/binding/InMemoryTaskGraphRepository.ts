/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { InMemoryTabularRepository } from "@podley/storage";
import {
  TaskGraphPrimaryKeyNames,
  TaskGraphSchema,
  TaskGraphTabularRepository,
} from "@podley/task-graph";
import { createServiceToken } from "@podley/util";

export const MEMORY_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphTabularRepository>(
  "taskgraph.taskGraphRepository.inMemory"
);

/**
 * In-memory implementation of a task graph repository.
 * Provides storage and retrieval for task graphs.
 */
export class InMemoryTaskGraphRepository extends TaskGraphTabularRepository {
  constructor() {
    super({
      tabularRepository: new InMemoryTabularRepository(TaskGraphSchema, TaskGraphPrimaryKeyNames),
    });
  }
}
