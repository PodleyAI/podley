//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SingleTask } from "./SingleTask";
import { TaskConfig, type TaskInput, type TaskOutput } from "./TaskTypes";
/**
 * Output tasks have side effects, and so need to always run and not be cached
 */
export class OutputTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends SingleTask<Input, Output, Config> {
  static readonly sideeffects = true;
}
