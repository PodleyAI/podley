/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { FsFolderTabularRepository } from "@podley/storage";
import {
  TaskOutputPrimaryKeyNames,
  TaskOutputSchema,
  TaskOutputTabularRepository,
} from "@podley/task-graph";
import { createServiceToken } from "@podley/util";

export const FS_FOLDER_TASK_OUTPUT_REPOSITORY = createServiceToken<FsFolderTaskOutputRepository>(
  "taskgraph.taskOutputRepository.fsFolder"
);

/**
 * File system folder implementation of a task output repository.
 * Provides storage and retrieval for task outputs using the file system.
 */
export class FsFolderTaskOutputRepository extends TaskOutputTabularRepository {
  constructor(folderPath: string) {
    super({
      tabularRepository: new FsFolderTabularRepository(
        folderPath,
        TaskOutputSchema,
        TaskOutputPrimaryKeyNames
      ),
    });
  }
}
