//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter, uuid4 } from "@podley/util";
import { Type, type TObject } from "typebox";
import { Compile, Validator } from "typebox/compile";
import { TaskGraph } from "../task-graph/TaskGraph";
import type { IExecuteContext, IExecuteReactiveContext, ITask } from "./ITask";
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
  type Provenance,
  type TaskConfig,
  type TaskInput,
  type TaskOutput,
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
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> implements ITask<Input, Output, Config>
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
   * The title of this task
   */
  public static title: string = "";

  /**
   * Whether this task has side effects
   */
  public static cacheable: boolean = true;

  /**
   * Input schema for this task
   */
  public static inputSchema(): TObject {
    return Type.Object({});
  }

  /**
   * Output schema for this task
   */
  public static outputSchema(): TObject {
    return Type.Object({});
  }

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
  public async execute(input: Input, context: IExecuteContext): Promise<Output | undefined> {
    if (context.signal?.aborted) {
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
    output: Output,
    context: IExecuteReactiveContext
  ): Promise<Output | undefined> {
    return output;
  }

  // ========================================================================
  // TaskRunner delegation - Executes and manages the task
  // ========================================================================

  /**
   * Task runner for handling the task execution
   */
  protected _runner: TaskRunner<Input, Output, Config> | undefined;

  /**
   * Gets the task runner instance
   * Creates a new one if it doesn't exist
   */
  public get runner(): TaskRunner<Input, Output, Config> {
    if (!this._runner) {
      this._runner = new TaskRunner<Input, Output, Config>(this);
    }
    return this._runner;
  }

  /**
   * Runs the task and returns the output
   * Delegates to the task runner
   *
   * @param overrides Optional input overrides
   * @throws TaskError if the task fails
   * @returns The task output
   */
  async run(overrides: Partial<Input> = {}): Promise<Output> {
    return this.runner.run(overrides);
  }

  /**
   * Runs the task in reactive mode
   * Delegates to the task runner
   *
   * @param overrides Optional input overrides
   * @returns The task output
   */
  public async runReactive(overrides: Partial<Input> = {}): Promise<Output> {
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
  public inputSchema(): TObject {
    return (this.constructor as typeof Task).inputSchema();
  }

  /**
   * Gets output schema for this task
   */
  public outputSchema(): TObject {
    return (this.constructor as typeof Task).outputSchema();
  }

  public get type(): TaskTypeName {
    return (this.constructor as typeof Task).type;
  }

  public get category(): string {
    return (this.constructor as typeof Task).category;
  }

  public get title(): string {
    return (this.constructor as typeof Task).title;
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
  defaults: Record<string, any>;

  /**
   * The input to the task at the time of the task run.
   * This takes defaults from construction time and overrides from run time.
   * It is the input that created the output.
   */
  runInputData: Record<string, any> = {};

  /**
   * The output of the task at the time of the task run.
   * This is the result of the task execution.
   */
  runOutputData: Record<string, any> = {};

  // ========================================================================
  // Task state properties
  // ========================================================================

  /**
   * The configuration of the task
   */
  config: Config;

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
  public get events(): EventEmitter<TaskEventListeners> {
    if (!this._events) {
      this._events = new EventEmitter<TaskEventListeners>();
    }
    return this._events;
  }
  protected _events: EventEmitter<TaskEventListeners> | undefined;

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
  constructor(callerDefaultInputs: Partial<Input> = {}, config: Partial<Config> = {}) {
    // Initialize input defaults
    const inputDefaults = this.getDefaultInputsFromStaticInputDefinitions();
    this.defaults = Object.assign(inputDefaults, callerDefaultInputs);
    this.resetInputData();

    // Setup configuration defaults
    const name = this.title || new.target.title || new.target.name;
    this.config = Object.assign(
      {
        id: uuid4(),
        name: name,
      },
      config
    ) as Config;
  }

  // ========================================================================
  // Input/Output handling
  // ========================================================================

  /**
   * Gets default input values from input schema
   */
  getDefaultInputsFromStaticInputDefinitions(): Partial<Input> {
    const schema = this.inputSchema();
    return Object.entries(schema.properties || {}).reduce<Record<string, any>>(
      (acc, [id, prop]) => {
        const defaultValue = (prop as any).default;
        if (defaultValue !== undefined) {
          acc[id] = defaultValue;
        }
        return acc;
      },
      {}
    ) as Partial<Input>;
  }

  /**
   * Resets input data to defaults
   */
  public resetInputData(): void {
    // Use deep clone to avoid state leakage
    try {
      this.runInputData = structuredClone(this.defaults) as Record<string, any>;
    } catch (err) {
      this.runInputData = JSON.parse(JSON.stringify(this.defaults)) as Record<string, any>;
    }
  }

  /**
   * Sets the default input values for the task
   *
   * @param defaults The default input values to set
   */
  public setDefaults(defaults: Record<string, any>): void {
    this.defaults = defaults;
  }

  /**
   * Sets input values for the task
   *
   * @param input Input values to set
   */
  public setInput(input: Record<string, any>): void {
    const schema = this.inputSchema();
    const properties = schema.properties || {};

    for (const [inputId, prop] of Object.entries(properties)) {
      const p = prop as any;
      if (input[inputId] !== undefined) {
        this.runInputData[inputId] = input[inputId];
      } else if (this.runInputData[inputId] === undefined && p.default !== undefined) {
        this.runInputData[inputId] = p.default;
      }
    }
  }

  /**
   * Stub for narrowing input. Override in subclasses for custom logic.
   * @param input The input to narrow
   * @returns The (possibly narrowed) input
   */
  public async narrowInput(input: Record<string, any>): Promise<Record<string, any>> {
    return input;
  }

  // ========================================================================
  // Event handling methods
  // ========================================================================

  /**
   * Subscribes to an event
   */
  public subscribe<Event extends TaskEvents>(
    name: Event,
    fn: TaskEventListener<Event>
  ): () => void {
    return this.events.subscribe(name, fn);
  }

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
    // this one is not like the others. Listeners will cause a lazy load of the event emitter.
    // but no need to emit if no one is listening, so we don't want to create the event emitter if not needed
    this._events?.emit(name, ...args);
  }

  // ========================================================================
  // Input validation methods
  // ========================================================================

  /**
   * The compiled input schema
   */
  private static _inputSchemaTypeChecker: Validator | undefined;

  /**
   * Gets the compiled input schema
   */
  protected static getInputSchemaTypeChecker(): Validator {
    if (!Task._inputSchemaTypeChecker) {
      Task._inputSchemaTypeChecker = Compile(Task.inputSchema());
    }
    return Task._inputSchemaTypeChecker;
  }

  /**
   * Validates an input data object against the task's input schema
   */
  public async validateInput(input: Partial<Input>): Promise<boolean> {
    const schema = this.inputSchema();

    // validate the partial input against the schema
    const checker = (this.constructor as typeof Task).getInputSchemaTypeChecker();
    if (!checker.Check(input)) {
      const errors = checker.Errors(input);
      throw new TaskInvalidInputError(
        `Input ${JSON.stringify(input)} does not match schema: ${errors
          .map((e: any) => `${e.message} (${e.instancePath?.slice(1) || ''})`)
          .join(", ")}`
      );
    }

    return true;
  }

  /**
   * Gets the task ID from the config
   */
  public id(): unknown {
    return this.config.id;
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
    const extras = this.config.extras;
    let json: JsonTaskItem | TaskGraphItemJson = {
      id: this.config.id,
      type: this.type,
      input: this.defaults,
      ...(Object.keys(provenance).length ? { provenance } : {}),
      ...(extras && Object.keys(extras).length ? { extras } : {}),
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

  // ========================================================================
  // Internal graph methods
  // ========================================================================

  /**
   * Checks if the task has children. Useful to gate to use of the internal subGraph
   * as this will return without creating a new graph if graph is non-existent .
   *
   * @returns True if the task has children, otherwise false
   */
  public hasChildren(): boolean {
    return (
      this._subGraph !== undefined &&
      this._subGraph !== null &&
      this._subGraph.getTasks().length > 0
    );
  }

  private _taskAddedListener: (task: ITask) => void = () => {
    this.emit("regenerate");
  };

  /**
   * The internal task graph containing subtasks
   *
   * In the base case, these may just be incidental tasks that are not part of the task graph
   * but are used to manage the task's state as part of task execution. Therefore, the graph
   * is not used by the default runner.
   */
  protected _subGraph: TaskGraph | undefined = undefined;

  /**
   * Sets the subtask graph for the compound task
   * @param subGraph The subtask graph to set
   */
  set subGraph(subGraph: TaskGraph) {
    if (this._subGraph) {
      this._subGraph.off("task_added", this._taskAddedListener);
    }
    this._subGraph = subGraph;
    this._subGraph.on("task_added", this._taskAddedListener);
  }

  /**
   * The internal task graph containing subtasks
   *
   * In the base case, these may just be incidental tasks that are not part of the task graph
   * but are used to manage the task's state as part of task execution. Therefore, the graph
   * is not used by the default runner.
   *
   * Creates a new graph if one doesn't exist.
   *
   * @returns The task graph
   */
  get subGraph(): TaskGraph {
    if (!this._subGraph) {
      this._subGraph = new TaskGraph();
      this._subGraph.on("task_added", this._taskAddedListener);
    }
    return this._subGraph;
  }

  /**
   * Regenerates the task graph, which is internal state to execute() with config.own()
   *
   * This is a destructive operation that removes all dataflows and tasks from the graph.
   * It is used to reset the graph to a clean state.
   *
   * GraphAsTask and others override this and do not call super
   */
  public regenerateGraph(): void {
    if (this.hasChildren()) {
      for (const dataflow of this.subGraph.getDataflows()) {
        this.subGraph.removeDataflow(dataflow);
      }
      for (const child of this.subGraph.getTasks()) {
        this.subGraph.removeTask(child.config.id);
      }
    }
    this.events.emit("regenerate");
  }
}
