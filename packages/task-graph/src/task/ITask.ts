//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { EventEmitter } from "@ellmers/util";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import type { TaskGraph } from "../task-graph/TaskGraph";
import { TaskError } from "./TaskError";
import type {
  JsonTaskItem,
  Provenance,
  TaskConfig,
  TaskEventListener,
  TaskEventListeners,
  TaskEventParameters,
  TaskEvents,
  TaskInput,
  TaskInputDefinition,
  TaskOutput,
  TaskOutputDefinition,
  TaskStatus,
} from "./TaskTypes";

/**
 * Interface for task static property metadata
 *
 *   ==== These should be overriden by every new Task class ====
 */
export interface ITaskStaticProperties {
  readonly type: string;
  readonly category: string;
  readonly sideeffects: boolean;
  readonly inputs: readonly TaskInputDefinition[];
  readonly outputs: readonly TaskOutputDefinition[];
}

/**
 *   ==== These should be overriden by every new Task class ====
 */
export interface ITaskRunFunctions<Input extends TaskInput, Output extends TaskOutput> {
  runFull(): Promise<Output>;
  runReactive(): Promise<Output>;
}

/**
 * Interface for task configuration and state
 */
export interface ITaskState<Config extends TaskConfig = TaskConfig> {
  readonly config: Config;
  status: TaskStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: TaskError;
}

/**
 * Interface for task input/output operations
 */
export interface ITaskIO<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> {
  defaults: Partial<Input>;
  runInputData: Input;
  runOutputData: Output;

  get inputs(): TaskInputDefinition[]; // this gets local access for static input definition property
  get outputs(): TaskOutputDefinition[]; // this gets local access for static output definition property

  resetInputData(): void;
  setInput(input: Partial<Input>): void;
  validateItem(valueType: string, item: any): Promise<boolean>;
  validateInputItem(input: Partial<Input>, inputId: keyof Input): Promise<boolean>;
  validateInputData(input: Partial<Input>): Promise<boolean>;
}

/**
 * Interface for task event handling
 */
export interface ITaskEvents {
  readonly events: EventEmitter<TaskEventListeners>;

  on<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  off<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  once<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  emitted<Event extends TaskEvents>(name: Event): Promise<TaskEventParameters<Event>>;
  emit<Event extends TaskEvents>(name: Event, ...args: TaskEventParameters<Event>): void;
}

/**
 * Interface for task lifecycle management
 */
export interface ITaskLifecycle<Output extends TaskOutput = TaskOutput> {
  abort(): void;
  handleStart(): void;
  handleComplete(): void;
  handleError(err: any): void;
  handleAbort(): void;
  handleProgress(progress: number, ...args: any[]): void;
  run(nodeProvenance: Provenance, repository?: TaskOutputRepository): Promise<Output>;
}

/**
 * Interface for task serialization
 */
export interface ITaskSerialization {
  getProvenance(): Provenance;
  toJSON(): JsonTaskItem;
  toDependencyJSON(): JsonTaskItem;
}

/**
 * Main task interface that combines all the specialized interfaces
 */
export interface ITask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends ITaskState<Config>,
    ITaskRunFunctions<Input, Output>,
    ITaskIO<Input, Output>,
    ITaskEvents,
    ITaskLifecycle<Output>,
    ITaskSerialization {
  readonly isCompound: boolean;
}

/**
 * Type for task constructor
 */
type ITaskConstructorType<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> = new (input: Input, config: Config) => ITask<Input, Output, Config>;

/**
 * Interface for task constructor with static properties
 */
export type ITaskConstructor<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> = ITaskConstructorType<Input, Output, Config> & ITaskStaticProperties;

/**
 * Interface for compound tasks
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
 * Interface for simple tasks
 */
export interface ISimpleTask<
  Input extends TaskInput,
  Output extends TaskOutput,
  Config extends TaskConfig,
> extends ITask<Input, Output, Config> {
  readonly isCompound: false;
}
