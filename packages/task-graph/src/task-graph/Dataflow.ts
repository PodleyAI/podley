//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskError } from "../task/TaskError";
import { Provenance, TaskIdType, TaskOutput, TaskStatus } from "../task/TaskTypes";

export type DataflowIdType = string;

export type DataflowJson = {
  sourceTaskId: unknown;
  sourceTaskPortId: string;
  targetTaskId: unknown;
  targetTaskPortId: string;
};

export const DATAFLOW_ALL_PORTS = "*";
export const DATAFLOW_ERROR_PORT = "[error]";

type DataflowId = `${string}.${string} -> ${string}.${string}`;

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
  get id(): DataflowId {
    return `${this.sourceTaskId}.${this.sourceTaskPortId} -> ${this.targetTaskId}.${this.targetTaskPortId}`;
  }
  public value: any = undefined;
  public provenance: Provenance = {};
  public status: TaskStatus = TaskStatus.PENDING;
  public error: TaskError | undefined;

  setPortData(entireDataBlock: any, nodeProvenance: any) {
    if (this.sourceTaskPortId === DATAFLOW_ALL_PORTS) {
      this.value = entireDataBlock;
    } else if (this.sourceTaskPortId === DATAFLOW_ERROR_PORT) {
      this.error = entireDataBlock;
    } else {
      this.value = entireDataBlock[this.sourceTaskPortId];
    }
    if (nodeProvenance) this.provenance = nodeProvenance;
  }

  getPortData(): TaskOutput {
    if (this.targetTaskPortId === DATAFLOW_ALL_PORTS) {
      return this.value;
    } else if (this.targetTaskPortId === DATAFLOW_ERROR_PORT) {
      return { [DATAFLOW_ERROR_PORT]: this.error };
    } else {
      return { [this.targetTaskPortId]: this.value };
    }
  }

  toJSON(): DataflowJson {
    return {
      sourceTaskId: this.sourceTaskId,
      sourceTaskPortId: this.sourceTaskPortId,
      targetTaskId: this.targetTaskId,
      targetTaskPortId: this.targetTaskPortId,
    };
  }
}

/**
 * Represents a data flow between two tasks, indicating how one task's output is used as input for another task
 *
 * This is a helper class that parses a data flow id string into a Dataflow object
 *
 * @param dataflow - The data flow string, e.g. "sourceTaskId.sourceTaskPortId -> targetTaskId.targetTaskPortId"
 */
export class DataflowArrow extends Dataflow {
  constructor(dataflow: DataflowId) {
    const [source, target] = dataflow.split(" -> ");
    const [sourceTaskId, sourceTaskPortId] = source.split(".");
    const [targetTaskId, targetTaskPortId] = target.split(".");
    super(sourceTaskId, sourceTaskPortId, targetTaskId, targetTaskPortId);
  }
}
