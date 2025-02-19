//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { ISimpleTask } from "./ITask";
import type { TaskOutput, TaskTypeName } from "./TaskTypes";
import { TaskBase } from "./TaskBase";

/**
 * Represents a single task, which is a basic unit of work in the task graph.
 * This is the base class for all simple (non-compound) tasks.
 */
export class SingleTask extends TaskBase implements ISimpleTask {
  static readonly type: TaskTypeName = "SingleTask";
  readonly isCompound = false;
}
