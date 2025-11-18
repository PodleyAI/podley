/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { FsFolderTabularRepository } from "@podley/storage";
import {
  TaskGraphPrimaryKeyNames,
  TaskGraphSchema,
  TaskGraphTabularRepository,
} from "@podley/task-graph";
import { createServiceToken } from "@podley/util";

export const FS_FOLDER_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphTabularRepository>(
  "taskgraph.taskGraphRepository.fsFolder"
);

/**
 * File-based implementation of a task graph repository.
 * Provides storage and retrieval for task graphs using a file system.
 */
export class FsFolderTaskGraphRepository extends TaskGraphTabularRepository {
  constructor(folderPath: string) {
    super({
      tabularRepository: new FsFolderTabularRepository(
        folderPath,
        TaskGraphSchema,
        TaskGraphPrimaryKeyNames
      ),
    });
  }
}
