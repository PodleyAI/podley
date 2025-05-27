//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { FsFolderTabularRepository } from "@podley/storage";
import {
  TaskGraphPrimaryKeyNames,
  TaskGraphTabularRepository,
  TaskGraphSchema,
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
