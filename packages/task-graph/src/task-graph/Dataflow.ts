//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter } from "@ellmers/util";
import { TaskError } from "../task/TaskError";
import { DataflowJson } from "../task/TaskJSON";
import { Provenance, TaskIdType, TaskOutput, TaskStatus } from "../task/TaskTypes";
import {
  DataflowEventListener,
  DataflowEvents,
  DataflowEventParameters,
  DataflowEventListeners,
} from "./DataflowEvents";

export type DataflowIdType = `${string}.${string} -> ${string}.${string}`;

export const DATAFLOW_ALL_PORTS = "*";
export const DATAFLOW_ERROR_PORT = "[error]";

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
  get id(): DataflowIdType {
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

  // ========================================================================
  // Event handling methods
  // ========================================================================

  /**
   * Event emitter for dataflow events
   */
  public readonly events = new EventEmitter<DataflowEventListeners>();

  /**
   * Registers an event listener
   */
  public on<Event extends DataflowEvents>(name: Event, fn: DataflowEventListener<Event>): void {
    this.events.on(name, fn);
  }

  /**
   * Removes an event listener
   */
  public off<Event extends DataflowEvents>(name: Event, fn: DataflowEventListener<Event>): void {
    this.events.off(name, fn);
  }

  /**
   * Registers a one-time event listener
   */
  public once<Event extends DataflowEvents>(name: Event, fn: DataflowEventListener<Event>): void {
    this.events.once(name, fn);
  }

  /**
   * Returns a promise that resolves when the specified event is emitted
   */
  public waitOn<Event extends DataflowEvents>(
    name: Event
  ): Promise<DataflowEventParameters<Event>> {
    return this.events.waitOn(name) as Promise<DataflowEventParameters<Event>>;
  }

  /**
   * Emits an event
   */
  public emit<Event extends DataflowEvents>(
    name: Event,
    ...args: DataflowEventParameters<Event>
  ): void {
    this.events.emit(name, ...args);
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
  constructor(dataflow: DataflowIdType) {
    const [source, target] = dataflow.split(" -> ");
    const [sourceTaskId, sourceTaskPortId] = source.split(".");
    const [targetTaskId, targetTaskPortId] = target.split(".");
    super(sourceTaskId, sourceTaskPortId, targetTaskId, targetTaskPortId);
  }
}
