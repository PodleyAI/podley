//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { ITaskSimple, TaskTypeName } from "./Task";
import { TaskBase } from "./TaskBase";

/**
 * Represents a single task, which is a basic unit of work in the task graph
 */

export class SingleTask extends TaskBase implements ITaskSimple {
  static readonly type: TaskTypeName = "SingleTask";
  readonly isCompound = false;
}
