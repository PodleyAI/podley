import { TaskInput, TaskOutput } from "../task/Task";

//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskIdType } from "/task/Task";

export type DataFlowIdType = string;

export type DataFlowJson = {
  sourceTaskId: unknown;
  sourceTaskOutputId: string;
  targetTaskId: unknown;
  targetTaskInputId: string;
};

/**
 * Represents a data flow between two tasks, indicating how one task's output is used as input for another task
 */
export class DataFlow {
  constructor(
    public sourceTaskId: TaskIdType,
    public sourceTaskOutputId: string,
    public targetTaskId: TaskIdType,
    public targetTaskInputId: string
  ) {}
  get id(): string {
    return `${this.sourceTaskId}.${this.sourceTaskOutputId} -> ${this.targetTaskId}.${this.targetTaskInputId}`;
  }
  public value: TaskOutput = {};
  public provenance: TaskInput = {};

  toJSON(): DataFlowJson {
    return {
      sourceTaskId: this.sourceTaskId,
      sourceTaskOutputId: this.sourceTaskOutputId,
      targetTaskId: this.targetTaskId,
      targetTaskInputId: this.targetTaskInputId,
    };
  }
}
