//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { EventEmitter } from "@ellmers/util";
import { TaskOutputRepository } from "../storage/TaskOutputRepository";
import type { TaskGraph } from "../task-graph/TaskGraph";
import { CompoundMergeStrategy, NamedGraphResult } from "../task-graph/TaskGraphRunner";
import { TaskError } from "./TaskError";
import type {
  TaskEventListener,
  TaskEventListeners,
  TaskEventParameters,
  TaskEvents,
} from "./TaskEvents";
import type { JsonTaskItem, TaskGraphItemJson } from "./TaskJSON";
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

/**
 * Configuration for task execution
 */
export interface IExecuteConfig {
  signal: AbortSignal;
  nodeProvenance: Provenance;
  updateProgress: (progress: number, message?: string, ...args: any[]) => void;
}

/**
 * Configuration for running a task
 */
export interface IRunConfig {
  nodeProvenance?: Provenance;
  outputCache?: TaskOutputRepository | boolean;
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
  readonly isCompound: boolean;
}

/**
 * Interface for task execution logic
 * These methods define how tasks are executed and should be implemented by Task subclasses
 */
export interface ITaskExecution<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
> {
  execute(input: Input, config: IExecuteConfig): Promise<ExecuteOutput | undefined>;
  executeReactive(input: Input, output: ExecuteOutput): Promise<ExecuteOutput | undefined>;
}

/**
 * Interface for task lifecycle management
 * These methods define how tasks are run and are usually delegated to a TaskRunner
 */
export interface ITaskLifecycle<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  RunOutput extends TaskOutput = ExecuteOutput,
> {
  run(overrides?: Partial<Input>, config?: IRunConfig): Promise<RunOutput>;
  runReactive(overrides?: Partial<Input>): Promise<RunOutput>;
  mergeExecuteOutputsToRunOutput(
    results: NamedGraphResult<ExecuteOutput>,
    compoundMerge: CompoundMergeStrategy
  ): RunOutput;
  abort(): void;
  skip(): Promise<void>;
}

/**
 * Interface for task input/output operations
 */
export interface ITaskIO<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  RunOutput extends TaskOutput = ExecuteOutput,
> {
  defaults: Partial<Input>;
  runInputData: Input;
  runIntermediateData: NamedGraphResult<ExecuteOutput>;
  runOutputData: RunOutput;

  get inputs(): readonly TaskInputDefinition[]; // this gets local access for static input definition property
  get outputs(): readonly TaskOutputDefinition[]; // this gets local access for static output definition property
  get type(): string; // this gets local access for static type property

  resetInputData(): void;
  setInput(input: Partial<Input>): void;
  validateInputValue(valueType: string, item: any): Promise<boolean>;
  validateInputDefinition(input: Partial<Input>, inputId: keyof Input): Promise<boolean>;
  validateInput(input: Partial<Input>): Promise<boolean>;
  get cacheable(): boolean;
}

export interface ITaskCompound {
  get isCompound(): boolean; // this gets local access for static isCompound property
  subGraph: TaskGraph | null;
  regenerateGraph(): void;
  hasChildren(): boolean;
  get compoundMerge(): CompoundMergeStrategy;
}

/**
 * Interface for task event handling
 */
export interface ITaskEvents {
  readonly events: EventEmitter<TaskEventListeners>;

  on<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  off<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  once<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  waitOn<Event extends TaskEvents>(name: Event): Promise<TaskEventParameters<Event>>;
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
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunOutput extends TaskOutput = ExecuteOutput,
> extends ITaskState<Config>,
    ITaskIO<Input, ExecuteOutput, RunOutput>,
    ITaskEvents,
    ITaskLifecycle<Input, ExecuteOutput, RunOutput>,
    ITaskExecution<Input, ExecuteOutput>,
    ITaskCompound,
    ITaskSerialization {}

/**
 * Type for task constructor
 */
type ITaskConstructorType<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunOutput extends TaskOutput = ExecuteOutput,
> = new (input: Input, config: Config) => ITask<Input, ExecuteOutput, Config, RunOutput>;

/**
 * Interface for task constructor with static properties
 */
export type ITaskConstructor<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunOutput extends TaskOutput = ExecuteOutput,
> = ITaskConstructorType<Input, ExecuteOutput, Config, RunOutput> & ITaskStaticProperties;
