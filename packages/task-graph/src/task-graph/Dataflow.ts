//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { areSemanticallyCompatible, EventEmitter } from "@podley/util";
import { Type } from "@sinclair/typebox";
import { TaskError } from "../task/TaskError";
import { DataflowJson } from "../task/TaskJSON";
import {
  Provenance,
  TaskIdType,
  TaskOutput,
  TaskStatus,
  type TaskStreamPortDescriptor,
} from "../task/TaskTypes";
import {
  DataflowEventListener,
  DataflowEventListeners,
  DataflowEventParameters,
  DataflowEvents,
} from "./DataflowEvents";
import { TaskGraph } from "./TaskGraph";

export type DataflowIdType = `${string}[${string}] ==> ${string}[${string}]`;

export const DATAFLOW_ALL_PORTS = "*";
export const DATAFLOW_ERROR_PORT = "[error]";

interface StreamListener {
  index: number;
  pending:
    | {
        resolve: (result: IteratorResult<unknown>) => void;
        reject: (error: unknown) => void;
      }
    | null;
  closed: boolean;
}

interface DataflowStreamState {
  descriptor: TaskStreamPortDescriptor<any, any>;
  history: unknown[];
  listeners: Set<StreamListener>;
  closed: boolean;
  error: TaskError | null;
  readinessReached: boolean;
}

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
  public static createId(
    sourceTaskId: TaskIdType,
    sourceTaskPortId: string,
    targetTaskId: TaskIdType,
    targetTaskPortId: string
  ): DataflowIdType {
    return `${sourceTaskId}[${sourceTaskPortId}] ==> ${targetTaskId}[${targetTaskPortId}]`;
  }
  get id(): DataflowIdType {
    return Dataflow.createId(
      this.sourceTaskId,
      this.sourceTaskPortId,
      this.targetTaskId,
      this.targetTaskPortId
    );
  }
  public value: any = undefined;
  public provenance: Provenance = {};
  public status: TaskStatus = TaskStatus.PENDING;
  public error: TaskError | undefined;
  private streamState: DataflowStreamState | null = null;

  public reset() {
    this.status = TaskStatus.PENDING;
    this.error = undefined;
    this.value = undefined;
    this.provenance = {};
    this.streamState = null;
    this.emit("reset");
    this.emit("status", this.status);
  }

  public setStatus(status: TaskStatus) {
    if (status === this.status) return;
    this.status = status;
    switch (status) {
      case TaskStatus.PROCESSING:
        this.emit("start");
        break;
      case TaskStatus.STREAMING:
        this.emit("stream_start");
        break;
      case TaskStatus.COMPLETED:
        this.emit("complete");
        break;
      case TaskStatus.ABORTING:
        this.emit("abort");
        break;
      case TaskStatus.PENDING:
        this.emit("reset");
        break;
      case TaskStatus.FAILED:
        this.emit("error", this.error!);
        break;
      case TaskStatus.SKIPPED:
        this.emit("skipped");
        break;
    }
    this.emit("status", this.status);
  }

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

  public beginStream(
    descriptor: TaskStreamPortDescriptor<any, any>,
    provenance?: Provenance
  ): void {
    if (!this.streamState) {
      this.streamState = {
        descriptor,
        history: [],
        listeners: new Set(),
        closed: false,
        error: null,
        readinessReached: false,
      };
    }
    if (provenance) {
      this.provenance = provenance;
    }
    this.setStatus(TaskStatus.STREAMING);
  }

  public pushStreamChunk(
    chunk: unknown,
    aggregate: unknown,
    provenance?: Provenance
  ): boolean {
    const state = this.ensureActiveStream();
    state.history.push(chunk);
    let readinessTriggered = false;
    if (!state.readinessReached && state.descriptor.readiness === "first-chunk") {
      state.readinessReached = true;
      readinessTriggered = true;
    }
    if (provenance) {
      this.provenance = provenance;
    }
    this.value = aggregate;
    this.emit("stream_chunk", chunk, aggregate);
    this.flushStreamListeners();
    return readinessTriggered;
  }

  public endStream(finalValue: unknown, provenance?: Provenance): boolean {
    const state = this.ensureActiveStream();
    state.closed = true;
    let readinessTriggered = false;
    if (state.descriptor.readiness === "final") {
      state.readinessReached = true;
      readinessTriggered = true;
    }
    if (provenance) {
      this.provenance = provenance;
    }
    this.value = finalValue;
    this.emit("stream_end", finalValue);
    this.flushStreamListeners();
    return readinessTriggered;
  }

  public failStream(error: TaskError): void {
    const state = this.ensureActiveStream();
    state.error = error;
    state.closed = true;
    this.flushStreamListeners();
    this.emit("error", error);
  }

  public streamIterator(): AsyncIterableIterator<unknown> {
    const state = this.ensureActiveStream();
    const listener: StreamListener = {
      index: 0,
      pending: null,
      closed: false,
    };
    state.listeners.add(listener);
    const iterator: AsyncIterableIterator<unknown> = {
      next: () => this.resolveStreamListener(listener),
      return: () => {
        this.cleanupStreamListener(listener, false);
        return Promise.resolve({ value: undefined, done: true });
      },
      throw: (error?: unknown) => {
        this.cleanupStreamListener(listener, false);
        return Promise.reject(error);
      },
      [Symbol.asyncIterator](): AsyncIterableIterator<unknown> {
        return this;
      },
    };
    this.flushStreamListener(listener);
    return iterator;
  }

  public hasActiveStream(): boolean {
    return this.streamState !== null && !this.streamState.closed;
  }

  public streamReadinessReached(): boolean {
    return this.streamState?.readinessReached ?? false;
  }

  public getStreamDescriptor(): TaskStreamPortDescriptor<any, any> | null {
    return this.streamState?.descriptor ?? null;
  }

  private ensureActiveStream(): DataflowStreamState {
    if (!this.streamState) {
      throw new TaskError("Streaming state has not been initialised for this dataflow.");
    }
    return this.streamState;
  }

  private resolveStreamListener(
    listener: StreamListener
  ): Promise<IteratorResult<unknown>> {
    return new Promise((resolve, reject) => {
      listener.pending = { resolve, reject };
      this.flushStreamListener(listener);
    });
  }

  private flushStreamListeners(): void {
    if (!this.streamState) return;
    for (const listener of Array.from(this.streamState.listeners)) {
      this.flushStreamListener(listener);
    }
  }

  private flushStreamListener(listener: StreamListener): void {
    const state = this.streamState;
    if (!state) return;
    if (listener.closed) {
      if (listener.pending) {
        listener.pending.resolve({ value: undefined, done: true });
        listener.pending = null;
      }
      state.listeners.delete(listener);
      return;
    }
    if (!listener.pending) {
      return;
    }
    if (listener.index < state.history.length) {
      const value = state.history[listener.index++];
      const { resolve } = listener.pending;
      listener.pending = null;
      resolve({ value, done: false });
      return;
    }
    if (state.error) {
      const { reject } = listener.pending;
      listener.pending = null;
      listener.closed = true;
      reject(state.error);
      state.listeners.delete(listener);
      return;
    }
    if (state.closed) {
      const { resolve } = listener.pending;
      listener.pending = null;
      listener.closed = true;
      resolve({ value: undefined, done: true });
      state.listeners.delete(listener);
    }
  }

  private cleanupStreamListener(listener: StreamListener, settle: boolean): void {
    const state = this.streamState;
    if (!state) return;
    if (listener.pending) {
      if (settle) {
        listener.pending.resolve({ value: undefined, done: true });
      }
      listener.pending = null;
    }
    listener.closed = true;
    state.listeners.delete(listener);
  }

  toJSON(): DataflowJson {
    return {
      sourceTaskId: this.sourceTaskId,
      sourceTaskPortId: this.sourceTaskPortId,
      targetTaskId: this.targetTaskId,
      targetTaskPortId: this.targetTaskPortId,
    };
  }

  semanticallyCompatible(
    graph: TaskGraph,
    dataflow: Dataflow
  ): "static" | "runtime" | "incompatible" {
    // TODO(str): this is inefficient
    const targetSchema = graph.getTask(dataflow.targetTaskId)!.inputSchema();
    const sourceSchema = graph.getTask(dataflow.sourceTaskId)!.outputSchema();

    const targetSchemaProperty =
      DATAFLOW_ALL_PORTS === dataflow.targetTaskPortId
        ? Type.Any()
        : (targetSchema.properties as any)?.[dataflow.targetTaskPortId];
    const sourceSchemaProperty =
      DATAFLOW_ALL_PORTS === dataflow.sourceTaskPortId
        ? Type.Any()
        : (sourceSchema.properties as any)?.[dataflow.sourceTaskPortId];

    const semanticallyCompatible = areSemanticallyCompatible(
      sourceSchemaProperty,
      targetSchemaProperty
    );

    return semanticallyCompatible;
  }

  // ========================================================================
  // Event handling methods
  // ========================================================================

  /**
   * Event emitter for dataflow events
   */
  public get events(): EventEmitter<DataflowEventListeners> {
    if (!this._events) {
      this._events = new EventEmitter<DataflowEventListeners>();
    }
    return this._events;
  }
  protected _events: EventEmitter<DataflowEventListeners> | undefined;

  public subscribe<Event extends DataflowEvents>(
    name: Event,
    fn: DataflowEventListener<Event>
  ): () => void {
    return this.events.subscribe(name, fn);
  }

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
    this._events?.emit(name, ...args);
  }
}

/**
 * Represents a data flow between two tasks, indicating how one task's output is used as input for another task
 *
 * This is a helper class that parses a data flow id string into a Dataflow object
 *
 * @param dataflow - The data flow string, e.g. "sourceTaskId[sourceTaskPortId] ==> targetTaskId[targetTaskPortId]"
 */
export class DataflowArrow extends Dataflow {
  constructor(dataflow: DataflowIdType) {
    // Parse the dataflow string using regex
    const pattern =
      /^([a-zA-Z0-9-]+?)\[([a-zA-Z0-9-]+?)\] ==> ([a-zA-Z0-9-]+?)\[([a-zA-Z0-9-]+?)\]$/;
    const match = dataflow.match(pattern);

    if (!match) {
      throw new Error(`Invalid dataflow format: ${dataflow}`);
    }

    const [, sourceTaskId, sourceTaskPortId, targetTaskId, targetTaskPortId] = match;
    super(sourceTaskId, sourceTaskPortId, targetTaskId, targetTaskPortId);
  }
}
