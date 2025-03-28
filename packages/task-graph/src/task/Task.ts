//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter, uuid4 } from "@ellmers/util";
import { TaskOutputRepository } from "../storage/TaskOutputRepository";
import { TaskGraph } from "../task-graph/TaskGraph";
import { CompoundMergeStrategy, NamedGraphResult } from "../task-graph/TaskGraphRunner";
import type { IExecuteConfig, IRunConfig, ITask } from "./ITask";
import { TaskAbortedError, TaskError, TaskInvalidInputError } from "./TaskError";
import {
  type TaskEventListener,
  type TaskEventListeners,
  type TaskEventParameters,
  type TaskEvents,
} from "./TaskEvents";
import type { JsonTaskItem, TaskGraphItemJson } from "./TaskJSON";
import { TaskRunner } from "./TaskRunner";
import {
  TaskStatus,
  type IConfig,
  type Provenance,
  type TaskConfig,
  type TaskInput,
  type TaskInputDefinition,
  type TaskOutput,
  type TaskOutputDefinition,
  type TaskTypeName,
} from "./TaskTypes";

/**
 * Base class for all tasks that implements the ITask interface.
 * This abstract class provides common functionality for both simple and compound tasks.
 *
 * The Task class is responsible for:
 * 1. Defining what a task is (inputs, outputs, configuration)
 * 2. Providing the execution logic (via execute and executeReactive)
 * 3. Delegating the running logic to a TaskRunner
 */
export class Task<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunOutput extends TaskOutput = ExecuteOutput,
> implements ITask<Input, ExecuteOutput, Config, RunOutput>
{
  // ========================================================================
  // Static properties - should be overridden by subclasses
  // ========================================================================

  /**
   * The type identifier for this task class
   */
  public static type: TaskTypeName = "Task";

  /**
   * The category this task belongs to
   */
  public static category: string = "Hidden";

  /**
   * Whether this task has side effects
   */
  public static cacheable: boolean = true;

  /**
   * Input definitions for this task
   */
  public static inputs: readonly TaskInputDefinition[] = [];

  /**
   * Output definitions for this task
   */
  public static outputs: readonly TaskOutputDefinition[] = [];

  /**
   * Whether this task is a compound task (contains subtasks)
   */
  public static isCompound: boolean = false;
  public static compoundMerge: CompoundMergeStrategy = "last-or-named";

  // ========================================================================
  // Task Execution Methods - Core logic provided by subclasses
  // ========================================================================

  /**
   * The actual task execution logic for subclasses to override
   *
   * @param input The input to the task
   * @param config The configuration for the task
   * @throws TaskError if the task fails
   * @returns The output of the task or undefined if no changes
   */
  public async execute(input: Input, config: IExecuteConfig): Promise<ExecuteOutput | undefined> {
    if (config.signal?.aborted) {
      throw new TaskAbortedError("Task aborted");
    }
    return undefined;
  }

  /**
   * Default implementation of executeReactive that does nothing.
   * Subclasses should override this to provide actual reactive functionality.
   *
   * This is generally for UI updating, and should be lightweight.
   * @param input The input to the task
   * @param output The current output of the task
   * @returns The updated output of the task or undefined if no changes
   */
  public async executeReactive(
    input: Input,
    output: ExecuteOutput
  ): Promise<ExecuteOutput | undefined> {
    return output;
  }

  // ========================================================================
  // TaskRunner delegation - Executes and manages the task
  // ========================================================================

  /**
   * Task runner for handling the task execution
   */
  protected _runner: TaskRunner<Input, ExecuteOutput, Config, RunOutput> | undefined;

  /**
   * Gets the task runner instance
   * Creates a new one if it doesn't exist
   */
  public get runner(): TaskRunner<Input, ExecuteOutput, Config, RunOutput> {
    if (!this._runner) {
      this._runner = new TaskRunner<Input, ExecuteOutput, Config, RunOutput>(
        this,
        this.outputCache
      );
    }
    return this._runner;
  }

  /**
   * Runs the task and returns the output
   * Delegates to the task runner
   *
   * @param overrides Optional input overrides
   * @param config Optional configuration overrides
   * @throws TaskError if the task fails
   * @returns The task output
   */
  async run(overrides: Partial<Input> = {}, config: IRunConfig = {}): Promise<RunOutput> {
    return this.runner.run(overrides, config);
  }

  /**
   * Runs the task in reactive mode
   * Delegates to the task runner
   *
   * @param overrides Optional input overrides
   * @returns The task output
   */
  public async runReactive(overrides: Partial<Input> = {}): Promise<RunOutput> {
    return this.runner.runReactive(overrides);
  }

  /**
   * Merges the execute output to the run output
   * @param results The execute output
   * @returns The run output
   */
  public mergeExecuteOutputsToRunOutput(
    results: NamedGraphResult<ExecuteOutput>,
    compoundMerge: CompoundMergeStrategy
  ): RunOutput {
    return this.runner.mergeExecuteOutputsToRunOutput(results, compoundMerge);
  }

  /**
   * Aborts task execution
   * Delegates to the task runner
   */
  public abort(): void {
    this.runner.abort();
  }

  /**
   * Skips task execution
   * Delegates to the task runner
   */
  public async skip(): Promise<void> {
    await this.runner.skip();
  }

  // ========================================================================
  // Static to Instance conversion methods
  // ========================================================================

  /**
   * Gets input definitions for this task
   */
  get inputs(): readonly TaskInputDefinition[] {
    return (this.constructor as typeof Task).inputs;
  }

  /**
   * Gets output definitions for this task
   */
  get outputs(): readonly TaskOutputDefinition[] {
    return (this.constructor as typeof Task).outputs ?? [];
  }

  /**
   * Gets whether this task is a compound task (contains subtasks)
   */
  public get isCompound(): boolean {
    return this.config?.isCompound ?? (this.constructor as typeof Task).isCompound;
  }

  public get type(): TaskTypeName {
    return (this.constructor as typeof Task).type;
  }

  public get category(): string {
    return (this.constructor as typeof Task).category;
  }

  public get compoundMerge(): CompoundMergeStrategy {
    return this.config?.compoundMerge || (this.constructor as typeof Task).compoundMerge;
  }

  public get cacheable(): boolean {
    return (
      // if cacheable is set in config, always use that
      this.config?.cacheable ?? ((this.constructor as typeof Task).cacheable && !this.hasChildren())
    );
  }

  public hasChildren(): boolean {
    return this.isCompound && this.subGraph !== null && this.subGraph.getTasks().length > 0;
  }

  // ========================================================================
  // Instance properties using @template types
  // ========================================================================

  /**
   * Default input values for this task.
   * If no overrides at run time, then this would be equal to the input.
   * resetInputData() will reset inputs to these defaults.
   */
  defaults: Partial<Input>;

  /**
   * The input to the task at the time of the task run.
   * This takes defaults from construction time and overrides from run time.
   * It is the input that created the output.
   */
  runInputData: Input = {} as Input;

  /**
   * The output of the task at the time of the task run.
   * This is the result of the task execution.
   */
  runOutputData: RunOutput = {} as RunOutput;

  /**
   * The intermediate data of the task at the time of the task run.
   * This is the result of the task execution.
   */
  runIntermediateData: NamedGraphResult<ExecuteOutput> = [] as NamedGraphResult<ExecuteOutput>;

  // ========================================================================
  // Task state properties
  // ========================================================================

  /**
   * The configuration of the task
   */
  config: IConfig & Config;

  /**
   * Current status of the task
   */
  status: TaskStatus = TaskStatus.PENDING;

  /**
   * Progress of the task (0-100)
   */
  progress: number = 0;

  /**
   * When the task was created
   */
  createdAt: Date = new Date();

  /**
   * When the task started execution
   */
  startedAt?: Date;

  /**
   * When the task completed execution
   */
  completedAt?: Date;

  /**
   * Error that occurred during task execution, if any
   */
  error?: TaskError;

  /**
   * Event emitter for task lifecycle events
   */
  public readonly events = new EventEmitter<TaskEventListeners>();

  /**
   * Cache for task outputs
   */
  protected outputCache: TaskOutputRepository | undefined;

  /**
   * Provenance information for the task
   */
  protected nodeProvenance: Provenance = {};

  /**
   * Creates a new task instance
   *
   * @param callerDefaultInputs Default input values provided by the caller
   * @param config Configuration for the task
   */
  constructor(
    callerDefaultInputs: Partial<Input> = {} as Partial<Input>,
    config: Config = {} as Config
  ) {
    // Initialize input defaults
    const inputDefaults = this.getDefaultInputsFromStaticInputDefinitions();
    this.defaults = Object.assign(inputDefaults, callerDefaultInputs);
    this.resetInputData();

    // Setup configuration defaults
    const name = this.type || new.target.type || new.target.name;
    this.config = Object.assign(
      {
        id: uuid4(),
        name: name,
        compoundMerge: this.compoundMerge,
      },
      config
    );

    if (this.isCompound) {
      this.regenerateGraph();
    }

    // Prevent serialization of events
    Object.defineProperty(this, "events", { enumerable: false });
  }

  // ========================================================================
  // Input/Output handling
  // ========================================================================

  /**
   * Gets default input values from static input definitions
   */
  getDefaultInputsFromStaticInputDefinitions(): Partial<Input> {
    return this.inputs.reduce<Record<string, any>>((acc, cur) => {
      if (cur.defaultValue !== undefined) {
        acc[cur.id] = cur.defaultValue;
      }
      return acc;
    }, {}) as Partial<Input>;
  }

  /**
   * Resets input data to defaults
   */
  public resetInputData(): void {
    // Use deep clone to avoid state leakage
    try {
      this.runInputData = structuredClone(this.defaults) as Input;
    } catch (err) {
      this.runInputData = JSON.parse(JSON.stringify(this.defaults)) as Input;
    }
    if (this.hasChildren()) {
      this.subGraph!.getTasks().forEach((node) => {
        node.resetInputData();
      });
    }
  }

  /**
   * Sets input values for the task
   *
   * @param input Input values to set
   */
  public setInput(input: Partial<Input>): void {
    for (const inputdef of this.inputs) {
      const inputId = inputdef.id as keyof Input;
      if (input[inputId] !== undefined) {
        this.runInputData[inputId] = input[inputId];
      } else if (this.runInputData[inputId] === undefined && inputdef.defaultValue !== undefined) {
        this.runInputData[inputId] = inputdef.defaultValue;
      }
    }
  }

  // ========================================================================
  // Event handling methods
  // ========================================================================

  /**
   * Registers an event listener
   */
  public on<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void {
    this.events.on(name, fn);
  }

  /**
   * Removes an event listener
   */
  public off<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void {
    this.events.off(name, fn);
  }

  /**
   * Registers a one-time event listener
   */
  public once<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void {
    this.events.once(name, fn);
  }

  /**
   * Returns a promise that resolves when the specified event is emitted
   */
  public waitOn<Event extends TaskEvents>(name: Event): Promise<TaskEventParameters<Event>> {
    return this.events.waitOn(name) as Promise<TaskEventParameters<Event>>;
  }

  /**
   * Emits an event
   */
  public emit<Event extends TaskEvents>(name: Event, ...args: TaskEventParameters<Event>): void {
    this.events.emit(name, ...args);
  }

  // ========================================================================
  //  Compound task methods
  // ========================================================================

  /**
   * The internal task graph containing subtasks
   */
  protected _subGraph: TaskGraph | null = null;

  /**
   * Sets the subtask graph for the compound task
   * @param subGraph The subtask graph to set
   */
  set subGraph(subGraph: TaskGraph) {
    this._subGraph = subGraph;
  }

  /**
   * Gets the subtask graph for the compound task.
   * Creates a new graph if one doesn't exist.
   * @returns The subtask graph
   */
  get subGraph(): TaskGraph | null {
    if (!this._subGraph && this.isCompound) {
      this._subGraph = new TaskGraph({
        outputCache: this.outputCache,
      });
    }
    return this._subGraph;
  }

  /**
   * Regenerates the subtask graph and emits a "regenerate" event
   *
   * Subclasses should override this method to implement the actual graph
   * regeneration logic, but all they need to do is call this method to
   * emit the "regenerate" event.
   */
  public regenerateGraph(): void {
    this.subGraph!.outputCache = this.outputCache;
    this.events.emit("regenerate");
  }

  // ========================================================================
  // Input validation methods
  // ========================================================================

  /**
   * Validates an item against the task's input definition
   *
   * @param valueType The type of the item
   * @param item The item to validate
   * @returns True if the item is valid, otherwise throws an error
   * @throws TaskInvalidInputError if the item is invalid
   */
  async validateInputValue(valueType: string, item: any): Promise<boolean> {
    switch (valueType) {
      case "any":
        return true;
      case "number": {
        const valid = typeof item === "bigint" || typeof item === "number";
        if (!valid) {
          throw new TaskInvalidInputError(`${item} is not a number`);
        }
        return valid;
      }
      case "text":
      case "string": {
        const valid = typeof item === "string";
        if (!valid) {
          throw new TaskInvalidInputError(`${item} is not a string`);
        }
        return valid;
      }
      case "boolean": {
        const valid = typeof item === "boolean";
        if (!valid) {
          throw new TaskInvalidInputError(`${item} is not a boolean`);
        }
        return valid;
      }
      case "function": {
        const valid = typeof item === "function";
        if (!valid) {
          throw new TaskInvalidInputError(`${item} is not a function`);
        }
        return valid;
      }
      default:
        throw new TaskInvalidInputError(`validateInputValue: Unknown value type: ${valueType}`);
    }
  }

  /**
   * Validates an input item against the task's input definition
   *
   * @param input The input to validate
   * @param inputId The id of the input to validate
   * @returns True if the input is valid, otherwise throws an error
   * @throws TaskInvalidInputError if the input is invalid
   */
  public async validateInputDefinition(
    input: Partial<Input>,
    inputId: keyof Input
  ): Promise<boolean> {
    const classRef = this.constructor as typeof Task;
    const inputdef = this.inputs.find((def) => def.id === inputId);

    if (!inputdef) {
      throw new TaskInvalidInputError(
        `validateInputDefinition: Unknown input id: ${inputId as string}`
      );
    }

    if (typeof input !== "object") {
      throw new TaskInvalidInputError(
        `validateInputDefinition: Input is not an object: ${inputId as string}`
      );
    }

    if (input[inputId] === undefined) {
      if (inputdef.defaultValue !== undefined) {
        input[inputId] = inputdef.defaultValue;
      } else {
        if (!inputdef.optional && inputdef.valueType !== "any") {
          throw new TaskInvalidInputError(
            `No default value for '${inputId as string}' in a ${classRef.type} so assumed required and not given (id:${this.config.id})`
          );
        }
      }
    }

    // force the input to be an array if the input definition says it is an array
    if (inputdef.isArray === true && !Array.isArray(input[inputId])) {
      input[inputId] = [input[inputId]] as any;
    }

    let inputlist: any[] = [];
    if (inputdef.isArray && Array.isArray(input[inputId])) {
      inputlist = input[inputId] as any[];
    } else {
      inputlist = [input[inputId]];
    }

    const validationPromises = inputlist.map((item) =>
      this.validateInputValue(inputdef.valueType as string, item)
    );

    const validationResults = await Promise.allSettled(validationPromises);
    return validationResults.every((result) => result.status === "fulfilled");
  }

  /**
   * Validates an input data object against the task's input definition
   *
   * @param input The input to validate
   * @returns True if the input is valid, otherwise throws an error
   * @throws TaskInvalidInputError if the input is invalid
   */
  public async validateInput(input: Partial<Input>): Promise<boolean> {
    for (const inputdef of this.inputs) {
      if (inputdef.optional && input[inputdef.id] === undefined) continue;
      await this.validateInputDefinition(input, inputdef.id);
    }
    return true;
  }

  /**
   * Gets provenance information for the task
   */
  public getProvenance(): Provenance {
    return this.config.provenance ?? {};
  }

  // ========================================================================
  // Serialization methods
  // ========================================================================

  /**
   * Serializes the task and its subtasks into a format that can be stored
   * @returns The serialized task and subtasks
   */
  public toJSON(): JsonTaskItem | TaskGraphItemJson {
    // this.resetInputData();
    const hasChildren = this.hasChildren();
    const provenance = this.getProvenance();
    let json: JsonTaskItem | TaskGraphItemJson = {
      id: this.config.id,
      type: this.type,
      input: this.defaults,
      ...(Object.keys(provenance).length ? { provenance } : {}),
      ...(hasChildren ? { merge: this.compoundMerge } : {}),
      ...(hasChildren ? { subgraph: this.subGraph!.toJSON() } : {}),
    };
    return json;
  }

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task and subtasks in JSON thats easier for humans to read
   */
  public toDependencyJSON(): JsonTaskItem {
    // this.resetInputData();
    const json = this.toJSON();
    if (this.hasChildren()) {
      if ("subgraph" in json) {
        delete json.subgraph;
      }
      return { ...json, subtasks: this.subGraph!.toDependencyJSON() };
    }
    return json;
  }
}
