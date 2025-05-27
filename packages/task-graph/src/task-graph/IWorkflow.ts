//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskInput, TaskOutput } from "../task/TaskTypes";
import { TaskGraph } from "./TaskGraph";

export interface IWorkflow<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> {
  graph: TaskGraph;
  run(input?: Input): Promise<Output>;
}
