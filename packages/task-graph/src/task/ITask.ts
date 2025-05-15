//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { EventEmitter } from "@ellmers/util";
import { TaskOutputRepository } from "../storage/TaskOutputRepository";
import { ITaskGraph } from "../task-graph/ITaskGraph";
import { IWorkflow } from "../task-graph/IWorkflow";
import type { TaskGraph } from "../task-graph/TaskGraph";
import { CompoundMergeStrategy } from "../task-graph/TaskGraphRunner";
import { TaskError } from "./TaskError";
import type {
  TaskEventListener,
  TaskEventListeners,
  TaskEventParameters,
  TaskEvents,
} from "./TaskEvents";
import type { JsonTaskItem, TaskGraphItemJson } from "./TaskJSON";
import { TaskRunner } from "./TaskRunner";
import type {
  Provenance,
  TaskConfig,
  TaskInput,
  TaskInputDefinition,
  TaskOutput,
  TaskOutputDefinition,
  TaskStatus,
} from "./TaskTypes";

/**
 * Configuration for task execution
 */
export interface IExecuteConfig {
  signal: AbortSignal;
  nodeProvenance: Provenance;
  updateProgress: (progress: number, message?: string, ...args: any[]) => void;
  own: <T extends ITask | ITaskGraph | IWorkflow>(i: T) => T;
}

export type IExecuteReactiveConfig = Pick<IExecuteConfig, "own">;

/**
 * Configuration for running a task
 */
export interface IRunConfig {
  nodeProvenance?: Provenance;
  outputCache?: TaskOutputRepository | boolean;
  onProgress?: (task: ITask, progress: number, message?: string, ...args: any[]) => void;
}

/**
 * Interface for task static property metadata
 *
 *   ==== These should be overriden by every new Task class ====
 */
export interface ITaskStaticProperties {
  readonly type: string;
  readonly category: string;
  readonly cacheable: boolean;
  readonly inputs: readonly TaskInputDefinition[];
  readonly outputs: readonly TaskOutputDefinition[];
}

/**
 * Interface for task execution logic
 * These methods define how tasks are executed and should be implemented by Task subclasses
 */
export interface ITaskExecution<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> {
  execute(input: Input, config: IExecuteConfig): Promise<Output | undefined>;
  executeReactive(
    input: Input,
    output: Output,
    config: IExecuteReactiveConfig
  ): Promise<Output | undefined>;
}

/**
 * Interface for task lifecycle management
 * These methods define how tasks are run and are usually delegated to a TaskRunner
 */
export interface ITaskLifecycle<
  Input extends TaskInput,
  Output extends TaskOutput,
  Config extends TaskConfig,
> {
  run(overrides?: Partial<Input>): Promise<Output>;
  runReactive(overrides?: Partial<Input>): Promise<Output>;
  get runner(): TaskRunner<Input, Output, Config>;
  abort(): void;
  skip(): Promise<void>;
}

/**
 * Interface for task input/output operations
 */
export interface ITaskIO<Input extends TaskInput, Output extends TaskOutput> {
  defaults: Partial<Input>;
  runInputData: Input;
  runOutputData: Output;

  get inputs(): readonly TaskInputDefinition[]; // this gets local access for static input definition property
  get outputs(): readonly TaskOutputDefinition[]; // this gets local access for static output definition property
  get type(): string; // this gets local access for static type property

  setDefaults(defaults: Partial<Input>): void;
  resetInputData(): void;
  setInput(input: Partial<Input>): void;
  validateInputValue(valueType: string, item: any): Promise<boolean>;
  validateInputDefinition(input: Partial<Input>, inputId: keyof Input): Promise<boolean>;
  validateInput(input: Partial<Input>): Promise<boolean>;
  get cacheable(): boolean;
}

export interface ITaskInternalGraph {
  subGraph: TaskGraph;
  hasChildren(): boolean;
}

/**
 * Interface for task event handling
 */
export interface ITaskEvents {
  get events(): EventEmitter<TaskEventListeners>;

  on<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  off<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  once<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  waitOn<Event extends TaskEvents>(name: Event): Promise<TaskEventParameters<Event>>;
  emit<Event extends TaskEvents>(name: Event, ...args: TaskEventParameters<Event>): void;
  subscribe<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): () => void;
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
  readonly config: Config;
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
    ITaskLifecycle<Input, Output, Config>,
    ITaskExecution<Input, Output>,
    ITaskSerialization,
    ITaskInternalGraph {}

export interface IGraphAsTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends ITask<Input, Output, Config> {
  regenerateGraph(): void;
  get compoundMerge(): CompoundMergeStrategy;
}

/**
 * Type for task constructor
 */
type ITaskConstructorType<
  Input extends TaskInput,
  Output extends TaskOutput,
  Config extends TaskConfig,
> = new (input: Input, config: Config) => ITask<Input, Output, Config>;

/**
 * Interface for task constructor with static properties
 */
export type ITaskConstructor<
  Input extends TaskInput,
  Output extends TaskOutput,
  Config extends TaskConfig,
> = ITaskConstructorType<Input, Output, Config> & ITaskStaticProperties;
