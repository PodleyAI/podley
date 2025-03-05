//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { EventEmitter } from "@ellmers/util";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import type { TaskGraph } from "../task-graph/TaskGraph";
import type { TaskGraphItemJson } from "./TaskJSON";
import { TaskError } from "./TaskError";
import type {
  IConfig,
  Provenance,
  TaskConfig,
  TaskInput,
  TaskInputDefinition,
  TaskOutput,
  TaskOutputDefinition,
  TaskStatus,
} from "./TaskTypes";
import type { JsonTaskItem } from "./TaskJSON";
import type {
  TaskEventListener,
  TaskEventListeners,
  TaskEventParameters,
  TaskEvents,
} from "./TaskEvents";

export interface IExecuteConfig {
  signal: AbortSignal;
  nodeProvenance: Provenance;
  updateProgress: (progress: number, message?: string, ...args: any[]) => void;
}

export interface IRunConfig {
  nodeProvenance?: Provenance;
  repository?: TaskOutputRepository;
}

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
  isCompound: boolean;
}

/**
 * Interface for task lifecycle management
 */
export interface ITaskLifecycle<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> {
  run(overrides?: Partial<Input>): Promise<Output>;
  runReactive(overrides?: Partial<Input>): Promise<Output>;
  abort(): void;
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

  get inputs(): readonly TaskInputDefinition[]; // this gets local access for static input definition property
  get outputs(): readonly TaskOutputDefinition[]; // this gets local access for static output definition property

  resetInputData(): void;
  setInput(input: Partial<Input>): void;
  validateItem(valueType: string, item: any): Promise<boolean>;
  validateInputItem(input: Partial<Input>, inputId: keyof Input): Promise<boolean>;
  validateInputData(input: Partial<Input>): Promise<boolean>;
}

export interface ITaskCompound {
  get isCompound(): boolean; // this gets local access for static isCompound property
  subGraph: TaskGraph | null;
  regenerateGraph(): void;
  hasChildren(): boolean;
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
 * Interface for task serialization
 */
export interface ITaskSerialization {
  getProvenance(): Provenance;
  toJSON(): JsonTaskItem | TaskGraphItemJson;
  toDependencyJSON(): JsonTaskItem;
}

/**
 * Interface for task configuration and state
 */
export interface ITaskState<Config extends TaskConfig = TaskConfig> {
  readonly config: IConfig & Config;
  status: TaskStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: TaskError;
}

/**
 * Main task interface that combines all the specialized interfaces
 */
export interface ITask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends ITaskState<Config>,
    ITaskIO<Input, Output>,
    ITaskEvents,
    ITaskLifecycle<Input, Output>,
    ITaskCompound,
    ITaskSerialization {}

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
