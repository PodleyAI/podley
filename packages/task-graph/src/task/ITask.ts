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
  TaskOutput,
  TaskStatus,
} from "./TaskTypes";
import { TObject } from "@sinclair/typebox";

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
  readonly inputSchema: TObject;
  readonly outputSchema: TObject;
  readonly isCompound: boolean;
}

/**
 * Interface for task execution logic
 * These methods define how tasks are executed and should be implemented by Task subclasses
 */
export interface ITaskExecution<
  ExecuteInput extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
> {
  /**
   * The actual task execution logic for subclasses to override
   * @param input The input to the task
   * @param config The configuration for the task
   * @returns The output of the task or undefined if no changes
   */
  execute(input: ExecuteInput, config: IExecuteConfig): Promise<ExecuteOutput | undefined>;

  /**
   * Reactive execution logic for updating UI or responding to changes
   * @param input The input to the task
   * @param output The current output of the task
   * @returns The updated output of the task or undefined if no changes
   */
  executeReactive(input: ExecuteInput, output: ExecuteOutput): Promise<ExecuteOutput | undefined>;
}

/**
 * Interface for task lifecycle management
 * These methods define how tasks are run and are usually delegated to a TaskRunner
 */
export interface ITaskLifecycle<
  ExecuteInput extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  RunInput extends TaskInput = ExecuteInput,
  RunOutput extends TaskOutput = ExecuteOutput,
> {
  /**
   * Runs the task with the provided input overrides
   * @param overrides Optional input overrides
   * @returns Promise resolving to the task output
   */
  run(overrides?: Partial<RunInput>, config?: IRunConfig): Promise<RunOutput>;

  /**
   * Runs the task in reactive mode
   * @param overrides Optional input overrides
   * @returns Promise resolving to the task output
   */
  runReactive(overrides?: Partial<RunInput>): Promise<RunOutput>;

  /**
   * Merges the execute output to the run output
   * @param results The execute output
   * @returns The run output
   */
  mergeExecuteOutputsToRunOutput(
    results: NamedGraphResult<ExecuteOutput>,
    compoundMerge: CompoundMergeStrategy
  ): RunOutput;

  /**
   * Aborts the task execution
   */
  abort(): void;
}

/**
 * Interface for task input/output operations
 */
export interface ITaskIO<
  ExecuteInput extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  RunInput extends TaskInput = ExecuteInput,
  RunOutput extends TaskOutput = ExecuteOutput,
> {
  defaults: Partial<RunInput>;
  runInputData: RunInput;
  runExecuteInputData: NamedGraphResult<ExecuteInput>;
  runExecuteOutputData: NamedGraphResult<ExecuteOutput>;
  runOutputData: RunOutput;

  get inputSchema(): TObject; // gets local access for static inputSchema property
  get outputSchema(): TObject; // gets local access for static outputSchema property
  get type(): string; // gets local access for static type property

  resetInputData(): void;
  setInput(input: Partial<RunInput>): void;
  validateInput(input: Partial<RunInput>): Promise<boolean>;
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
  ExecuteInput extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunInput extends TaskInput = ExecuteInput,
  RunOutput extends TaskOutput = ExecuteOutput,
> extends ITaskState<Config>,
    ITaskIO<ExecuteInput, ExecuteOutput, RunInput, RunOutput>,
    ITaskEvents,
    ITaskLifecycle<ExecuteInput, ExecuteOutput, RunInput, RunOutput>,
    ITaskExecution<ExecuteInput, ExecuteOutput>,
    ITaskCompound,
    ITaskSerialization {}

/**
 * Type for task constructor
 */
type ITaskConstructorType<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunInput extends TaskInput = Input,
  RunOutput extends TaskOutput = ExecuteOutput,
> = new (input: Input, config: Config) => ITask<Input, ExecuteOutput, Config, RunInput, RunOutput>;

/**
 * Interface for task constructor with static properties
 */
export type ITaskConstructor<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunInput extends TaskInput = Input,
  RunOutput extends TaskOutput = ExecuteOutput,
> = ITaskConstructorType<Input, ExecuteOutput, Config, RunInput, RunOutput> & ITaskStaticProperties;
