//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Provenance, TaskIdType } from "../task/TaskTypes";

export type DataflowIdType = string;

export type DataflowJson = {
  sourceTaskId: unknown;
  sourceTaskPortId: string;
  targetTaskId: unknown;
  targetTaskPortId: string;
};

export const DATAFLOW_ALL_PORTS = "*";

/**
 * Represents a data flow between two tasks, indicating how one task's output is used as input for another task
 */
export class Dataflow {
  constructor(
    public sourceTaskId: TaskIdType,
    public sourceTaskPortId: string,
    public targetTaskId: TaskIdType,
    public targetTaskPortId: string
  ) {}
  get id(): string {
    return `${this.sourceTaskId}.${this.sourceTaskPortId} -> ${this.targetTaskId}.${this.targetTaskPortId}`;
  }
  public value: any = undefined;
  public provenance: Provenance = {};

  toJSON(): DataflowJson {
    return {
      sourceTaskId: this.sourceTaskId,
      sourceTaskPortId: this.sourceTaskPortId,
      targetTaskId: this.targetTaskId,
      targetTaskPortId: this.targetTaskPortId,
    };
  }
}

export class DataflowArrow extends Dataflow {
  constructor(dataflow: string) {
    const [source, target] = dataflow.split(" -> ");
    const [sourceTaskId, sourceTaskPortId] = source.split(".");
    const [targetTaskId, targetTaskPortId] = target.split(".");
    super(sourceTaskId, sourceTaskPortId, targetTaskId, targetTaskPortId);
  }
}
