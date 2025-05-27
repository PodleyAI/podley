//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ITask, TaskStatus } from "@podley/task-graph";

// Common props for all node types
export interface NodeTaskProps {
  task: ITask;
  status: TaskStatus;
  progress: number;
  statusColor: string;
  isConnectable?: boolean;
}
