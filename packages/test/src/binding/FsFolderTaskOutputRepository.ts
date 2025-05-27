//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { FsFolderTabularRepository } from "@podley/storage";
import {
  TaskOutputSchema,
  TaskOutputPrimaryKeyNames,
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
