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
  type TaskOutput,
  type TaskTypeName,
} from "./TaskTypes";
import { Type, TObject } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

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
  RunInput extends TaskInput = TaskInput,
  RunOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> implements ITask<RunInput, RunOutput, Config>
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
   * Input schema for this task
   */
  public static inputSchema: TObject = Type.Object({});

  /**
   * Output schema for this task
   */
  public static outputSchema: TObject = Type.Object({});

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
  public async execute(input: RunInput, config: IExecuteConfig): Promise<RunOutput | undefined> {
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
  public async executeReactive(input: RunInput, output: RunOutput): Promise<RunOutput | undefined> {
    return output;
  }

  // ========================================================================
  // TaskRunner delegation - Executes and manages the task
  // ========================================================================

  /**
   * Task runner for handling the task execution
   */
  protected _runner: TaskRunner<RunInput, RunOutput, Config> | undefined;

  /**
   * Gets the task runner instance
   * Creates a new one if it doesn't exist
   */
  public get runner(): TaskRunner<RunInput, RunOutput, Config> {
    if (!this._runner) {
      this._runner = new TaskRunner<RunInput, RunOutput, Config>(this, this.outputCache);
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
  async run(overrides: Partial<RunInput> = {}, config: IRunConfig = {}): Promise<RunOutput> {
    return this.runner.run(overrides, config);
  }

  /**
   * Runs the task in reactive mode
   * Delegates to the task runner
   *
   * @param overrides Optional input overrides
   * @returns The task output
   */
  public async runReactive(overrides: Partial<RunInput> = {}): Promise<RunOutput> {
    return this.runner.runReactive(overrides);
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
   * Gets input schema for this task
   */
  get inputSchema(): TObject {
    return (this.constructor as typeof Task).inputSchema;
  }

  /**
   * Gets output schema for this task
   */
  get outputSchema(): TObject {
    return (this.constructor as typeof Task).outputSchema;
  }

  public get type(): TaskTypeName {
    return (this.constructor as typeof Task).type;
  }

  public get category(): string {
    return (this.constructor as typeof Task).category;
  }

  public get cacheable(): boolean {
    return (
      // if cacheable is set in config, always use that
      this.config?.cacheable ?? (this.constructor as typeof Task).cacheable
    );
  }

  // ========================================================================
  // Instance properties using @template types
  // ========================================================================

  /**
   * Default input values for this task.
   * If no overrides at run time, then this would be equal to the input.
   * resetInputData() will reset inputs to these defaults.
   */
  defaults: Partial<RunInput>;

  /**
   * The input to the task at the time of the task run.
   * This takes defaults from construction time and overrides from run time.
   * It is the input that created the output.
   */
  runInputData: RunInput = {} as RunInput;

  /**
   * The output of the task at the time of the task run.
   * This is the result of the task execution.
   */
  runOutputData: RunOutput = {} as RunOutput;

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
    callerDefaultInputs: Partial<RunInput> = {} as Partial<RunInput>,
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
      },
      config
    );

    // Prevent serialization of events
    Object.defineProperty(this, "events", { enumerable: false });
  }

  // ========================================================================
  // Input/Output handling
  // ========================================================================

  /**
   * Gets default input values from input schema
   */
  getDefaultInputsFromStaticInputDefinitions(): Partial<RunInput> {
    const schema = this.inputSchema as TObject;
    return Object.entries(schema.properties || {}).reduce<Record<string, any>>(
      (acc, [id, prop]) => {
        const defaultValue = (prop as any).default;
        if (defaultValue !== undefined) {
          acc[id] = defaultValue;
        }
        return acc;
      },
      {}
    ) as Partial<RunInput>;
  }

  /**
   * Resets input data to defaults
   */
  public resetInputData(): void {
    // Use deep clone to avoid state leakage
    try {
      this.runInputData = structuredClone(this.defaults) as RunInput;
    } catch (err) {
      this.runInputData = JSON.parse(JSON.stringify(this.defaults)) as RunInput;
    }
  }

  /**
   * Sets input values for the task
   *
   * @param input Input values to set
   */
  public setInput(input: Partial<RunInput>): void {
    const schema = this.inputSchema as TObject;
    const properties = schema.properties || {};

    for (const [id, prop] of Object.entries(properties)) {
      const inputId = id as keyof RunInput;
      if (input[inputId] !== undefined) {
        this.runInputData[inputId] = input[inputId];
      } else if (this.runInputData[inputId] === undefined && prop.default !== undefined) {
        this.runInputData[inputId] = prop.default;
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
  // Input validation methods
  // ========================================================================

  /**
   * Validates an input data object against the task's input schema
   */
  public async validateInput(input: Partial<RunInput>): Promise<boolean> {
    const schema = this.inputSchema as TObject;

    // validate the partial input against the schema
    const check = TypeCompiler.Compile(schema);
    if (!check.Check(input)) {
      throw new TaskInvalidInputError(`Input ${JSON.stringify(input)} does not match schema`);
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
    const provenance = this.getProvenance();
    let json: JsonTaskItem | TaskGraphItemJson = {
      id: this.config.id,
      type: this.type,
      input: this.defaults,
      ...(Object.keys(provenance).length ? { provenance } : {}),
    };
    return json;
  }

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task and subtasks in JSON thats easier for humans to read
   */
  public toDependencyJSON(): JsonTaskItem {
    const json = this.toJSON();
    return json;
  }
}
