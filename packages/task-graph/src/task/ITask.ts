//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { EventEmitter } from "@ellmers/util";
import type { TaskGraph } from "../task-graph/TaskGraph";
import type {
  TaskStatus,
  TaskInput,
  TaskOutput,
  TaskConfig,
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskEventListeners,
  TaskEvents,
  TaskEventListener,
  TaskEventParameters,
  JsonTaskItem,
  Provenance,
} from "./TaskTypes";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskError } from "./TaskError";

interface ITaskStaticProperties {
  type: string;
  category: string;
  sideeffects: boolean;
  inputs: readonly TaskInputDefinition[];
  outputs: readonly TaskOutputDefinition[];
}

// Define the constructor type separately
type ITaskConstructorType<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> = new (input: Input, config: Config) => ITask<Input, Output, Config>;

// Combine the constructor type with the static properties
export type ITaskConstructor<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> = ITaskConstructorType<Input, Output, Config> & ITaskStaticProperties;

/**
 * Core interface that all tasks must implement
 */
export interface ITask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> {
  // getters for static properties
  get inputs(): TaskInputDefinition[];
  get outputs(): TaskOutputDefinition[];

  // Instance properties
  readonly isCompound: boolean;
  readonly config: Config;
  status: TaskStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: TaskError;

  // Runtime data
  defaults: TaskInput;
  runInputData: Input;
  runOutputData: Output;

  // Event handling
  readonly events: EventEmitter<TaskEventListeners>;
  on<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  off<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  once<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  emitted<Event extends TaskEvents>(name: Event): Promise<TaskEventParameters<Event>>;
  emit<Event extends TaskEvents>(name: Event, ...args: TaskEventParameters<Event>): void;

  // Core task methods
  run(nodeProvenance: Provenance, repository?: TaskOutputRepository): Promise<Output>;
  runFull(): Promise<Output>;
  runReactive(): Promise<Output>;
  abort(): void;

  handleStart(): void;
  handleComplete(): void;
  handleError(err: any): void;
  handleAbort(): void;
  handleProgress(progress: number, ...args: any[]): void;
  getProvenance(): TaskInput;
  resetInputData(): void;
  setInput(input: Partial<Input>): void;
  validateItem(valueType: string, item: any): Promise<boolean>;
  validateInputItem(input: Partial<Input>, inputId: keyof Input): Promise<boolean>;
  validateInputData(input: Partial<Input>): Promise<boolean>;
  toJSON(): JsonTaskItem;
  toDependencyJSON(): JsonTaskItem;
}

/**
 * Interface for tasks that can contain subtasks
 */
export interface ICompoundTask<
  Input extends TaskInput,
  Output extends TaskOutput,
  Config extends TaskConfig,
> extends ITask<Input, Output, Config> {
  readonly isCompound: true;
  readonly subGraph: TaskGraph;
}

/**
 * Interface for simple tasks without subtasks
 */
export interface ISimpleTask<
  Input extends TaskInput,
  Output extends TaskOutput,
  Config extends TaskConfig,
> extends ITask<Input, Output, Config> {
  readonly isCompound: false;
}
