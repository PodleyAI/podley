//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@ellmers/util";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskGraphRepository } from "../storage/taskgraph/TaskGraphRepository";

/**
 * Service token for TaskOutputRepository
 */
export const TASK_OUTPUT_REPOSITORY = createServiceToken<TaskOutputRepository>(
  "taskgraph.taskOutputRepository"
);

// Task Output Actual Implementations
export const MEMORY_TASK_OUTPUT_REPOSITORY = createServiceToken<TaskOutputRepository>(
  "taskgraph.taskOutputRepository.inMemory"
);
export const IDB_TASK_OUTPUT_REPOSITORY = createServiceToken<TaskOutputRepository>(
  "taskgraph.taskOutputRepository.indexedDb"
);
export const POSTGRES_TASK_OUTPUT_REPOSITORY = createServiceToken<TaskOutputRepository>(
  "taskgraph.taskOutputRepository.postgres"
);
export const SQLITE_TASK_OUTPUT_REPOSITORY = createServiceToken<TaskOutputRepository>(
  "taskgraph.taskOutputRepository.sqlite"
);
export const FS_FOLDER_TASK_OUTPUT_REPOSITORY = createServiceToken<TaskOutputRepository>(
  "taskgraph.taskOutputRepository.fsFolder"
);

/**
 * Service token for TaskGraphRepository
 */
export const TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository"
);

// Task Graph Actual Implementations
export const MEMORY_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository.inMemory"
);
export const IDB_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository.indexedDb"
);
export const POSTGRES_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository.postgres"
);
export const SQLITE_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository.sqlite"
);
export const FS_FOLDER_TASK_GRAPH_REPOSITORY = createServiceToken<TaskGraphRepository>(
  "taskgraph.taskGraphRepository.fsFolder"
);
