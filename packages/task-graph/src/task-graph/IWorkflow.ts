//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraph } from "./TaskGraph";

export interface IWorkflow {
  graph: TaskGraph;
  run(): Promise<void>;
  runReactive(): Promise<void>;
}
