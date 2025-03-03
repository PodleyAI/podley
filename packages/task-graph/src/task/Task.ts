//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter } from "@ellmers/util";
import { nanoid } from "nanoid";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskGraph } from "../task-graph/TaskGraph";
import { TaskGraphRunner } from "../task-graph/TaskGraphRunner";
import type { ITask } from "./ITask";
import { TaskAbortedError, TaskError, TaskFailedError, TaskInvalidInputError } from "./TaskError";
import {
  type TaskEventListener,
  type TaskEventListeners,
  type TaskEventParameters,
  type TaskEvents,
} from "./TaskEvents";
import type { TaskGraphItemJson, JsonTaskItem } from "./TaskJSON";
import {
  Provenance,
  TaskStatus,
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
  public static readonly type: TaskTypeName = "Task";

  /**
   * The category this task belongs to
   */
  public static readonly category: string = "Hidden";

  /**
   * Whether this task has side effects
   */
  public static readonly sideeffects: boolean = false;

  /**
   * Input definitions for this task
   */
  public static readonly inputs: readonly TaskInputDefinition[] = [];

  /**
   * Output definitions for this task
   */
  public static readonly outputs: readonly TaskOutputDefinition[] = [];

  /**
   * Whether this task is a compound task (contains subtasks)
   */
  public static readonly isCompound: boolean = false;

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
    return (this.constructor as typeof Task).isCompound;
  }

  // ========================================================================
  // Instance properties - some to be overridden by subclasses
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
  runOutputData: Output = {} as Output;

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
  public readonly events = new EventEmitter<TaskEventListeners>();

  /**
   * AbortController for cancelling task execution
   */
  protected abortController: AbortController | undefined;

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
    const name = new.target.type || new.target.name;
    this.config = Object.assign(
      {
        id: nanoid(),
        name: name,
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
    if (this.isCompound) {
      this.subGraph!.getNodes().forEach((node) => {
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
  public emitted<Event extends TaskEvents>(name: Event): Promise<TaskEventParameters<Event>> {
    return this.events.emitted(name) as Promise<TaskEventParameters<Event>>;
  }

  /**
   * Emits an event
   */
  public emit<Event extends TaskEvents>(name: Event, ...args: TaskEventParameters<Event>): void {
    this.events.emit(name, ...args);
  }

  // ========================================================================
  // Task lifecycle methods
  // ========================================================================

  /**
   * Aborts task execution
   */
  public abort(): void {
    this.abortController?.abort();
  }

  /**
   * Handles task start
   */
  public handleStart(): void {
    if (this.status === TaskStatus.PROCESSING) return;

    this.startedAt = new Date();
    this.nodeProvenance = {};
    this.outputCache = undefined;
    this.progress = 0;
    this.status = TaskStatus.PROCESSING;

    this.abortController = new AbortController();
    this.abortController.signal.addEventListener("abort", () => {
      this.handleAbort();
    });

    this.events.emit("start");
  }

  /**
   * Handles task abort
   */
  public handleAbort(): void {
    if (this.status === TaskStatus.ABORTING) return;

    this.status = TaskStatus.ABORTING;
    this.progress = 100;
    this.error = new TaskAbortedError();

    this.events.emit("abort", this.error);
  }

  /**
   * Handles task completion
   */
  public handleComplete(): void {
    if (this.status === TaskStatus.COMPLETED) return;

    this.completedAt = new Date();
    this.progress = 100;
    this.status = TaskStatus.COMPLETED;
    this.abortController = undefined;
    this.outputCache = undefined;
    this.nodeProvenance = {};

    this.events.emit("complete");
  }

  /**
   * Handles task error
   *
   * @param err Error that occurred
   */
  public handleError(err: Error): void {
    if (err instanceof TaskAbortedError) return this.handleAbort();
    if (this.status === TaskStatus.FAILED) return;

    this.completedAt = new Date();
    this.progress = 100;
    this.status = TaskStatus.FAILED;
    this.error =
      err instanceof TaskError ? err : new TaskFailedError(err?.message || "Task failed");
    this.abortController = undefined;
    this.outputCache = undefined;
    this.nodeProvenance = {};

    this.events.emit("error", this.error);
  }

  /**
   * Handles task progress update
   *
   * @param progress Progress value (0-100)
   * @param args Additional arguments
   */
  public handleProgress(progress: number, ...args: any[]): void {
    this.progress = progress;
    this.events.emit("progress", progress, ...args);
  }

  /**
   * Runs the task and returns the output
   *
   * @param nodeProvenance Provenance information
   * @param repository Repository for caching task outputs
   * @returns Task output
   */
  async run(nodeProvenance: Provenance = {}, repository?: TaskOutputRepository): Promise<Output> {
    this.handleStart();
    this.nodeProvenance = nodeProvenance;
    this.outputCache = repository;

    try {
      const isValid = await this.validateInputData(this.runInputData);
      if (!isValid) {
        throw new TaskInvalidInputError("Invalid input data");
      }

      if (this.abortController?.signal.aborted) {
        this.handleAbort();
        throw new TaskAbortedError("Promise for task created and aborted before run");
      }

      this.runOutputData = await this.runFull();
      this.handleComplete();

      return this.runOutputData;
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
  }

  // ========================================================================
  // Task execution methods
  // ========================================================================

  /**
   * Default implementation of runFull that just returns the current output data.
   * Subclasses should override this to provide actual task functionality.
   *
   * @returns The task output
   */

  public async runFull(): Promise<Output> {
    if (!this.isCompound) {
      this.runOutputData = await this.runReactive();
    } else {
      const runner = new TaskGraphRunner(this.subGraph!, this.outputCache);
      // @ts-ignore TODO: fix this
      this.runOutputData.outputs = await runner.runGraph(
        this.nodeProvenance,
        this.abortController!.signal
      );
    }
    return this.runOutputData;
  }

  /**
   * Default implementation of runReactive that just returns the current output data.
   * Subclasses should override this to provide actual reactive functionality.
   *
   * This is generally for UI updating, and should be lightweight.
   *
   * @returns The task output
   */
  public async runReactive(): Promise<Output> {
    if (!this.isCompound) {
      if (Object.keys(this.runOutputData).length === 0) {
        this.runOutputData = Object.assign({}, this.defaults) as Output;
      }
      return this.runOutputData;
    } else {
      const runner = new TaskGraphRunner(this.subGraph!);
      // @ts-ignore TODO: fix this
      this.runOutputData.outputs = await runner.runGraphReactive();
      return this.runOutputData;
    }
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
      this._subGraph = new TaskGraph();
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
  async validateItem(valueType: string, item: any): Promise<boolean> {
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
        throw new TaskInvalidInputError(`validateItem: Unknown value type: ${valueType}`);
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
  public async validateInputItem(input: Partial<Input>, inputId: keyof Input): Promise<boolean> {
    const classRef = this.constructor as typeof Task;
    const inputdef = this.inputs.find((def) => def.id === inputId);

    if (!inputdef) {
      throw new TaskInvalidInputError(`validateInputItem: Unknown input id: ${inputId as string}`);
    }

    if (typeof input !== "object") {
      throw new TaskInvalidInputError(
        `validateInputItem: Input is not an object: ${inputId as string}`
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

    if (inputdef.isArray && !Array.isArray(input[inputId])) {
      input[inputId] = [input[inputId]] as any;
    }

    const inputlist: any[] = inputdef.isArray ? (input[inputId] as any[]) : [input[inputId]];

    const validationPromises = inputlist.map((item) =>
      this.validateItem(inputdef.valueType as string, item)
    );

    const validationResults = await Promise.all(validationPromises);
    return validationResults.every((result) => result === true);
  }

  /**
   * Validates an input data object against the task's input definition
   *
   * @param input The input to validate
   * @returns True if the input is valid, otherwise throws an error
   * @throws TaskInvalidInputError if the input is invalid
   */
  public async validateInputData(input: Partial<Input>): Promise<boolean> {
    for (const inputdef of this.inputs) {
      if (inputdef.optional && input[inputdef.id] === undefined) continue;
      await this.validateInputItem(input, inputdef.id);
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
    this.resetInputData();
    const provenance = this.getProvenance();
    let json: JsonTaskItem | TaskGraphItemJson = {
      id: this.config.id,
      type: (this.constructor as typeof Task).type,
      input: this.defaults,
      ...(Object.keys(provenance).length ? { provenance } : {}),
    };
    if (!this.isCompound) {
      return json;
    }
    return { ...json, subgraph: this.subGraph!.toJSON() };
  }

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task and subtasks in JSON thats easier for humans to read
   */
  public toDependencyJSON(): JsonTaskItem {
    this.resetInputData();
    const json = this.toJSON();
    if (this.isCompound) {
      return { ...json, subtasks: this.subGraph!.toDependencyJSON() };
    }
    return json;
  }
}
