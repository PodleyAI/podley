//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter } from "@ellmers/util";
import { nanoid } from "nanoid";
import type { ITask } from "./ITask";
import {
  TaskStatus,
  type TaskTypeName,
  type TaskInputDefinition,
  type TaskOutputDefinition,
  type TaskEvents,
  type TaskConfig,
  type TaskInput,
  type TaskOutput,
  type JsonTaskItem,
  type TaskEventListener,
  type TaskEventParameters,
  type TaskEventListeners,
  type IConfig,
  Provenance,
} from "./TaskTypes";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskAbortedError, TaskError, TaskFailedError, TaskInvalidInputError } from "./TaskError";

/**
 * Base class for all tasks that implements the ITask interface
 */
export abstract class TaskBase implements ITask {
  // Static properties that should be overridden by subclasses
  static readonly type: TaskTypeName = "TaskBase";
  static readonly category: string = "Hidden";
  static readonly sideeffects: boolean = false;

  // Instance properties from static
  // readonly type: TaskTypeName = (this.constructor as typeof TaskBase).type;
  // readonly category: string = (this.constructor as typeof TaskBase).category;
  // readonly sideeffects: boolean = (this.constructor as typeof TaskBase).sideeffects;

  // Instance properties
  abstract readonly isCompound: boolean;
  config: IConfig;
  status: TaskStatus = TaskStatus.PENDING;
  progress: number = 0;
  createdAt: Date = new Date();
  startedAt?: Date;
  completedAt?: Date;
  error?: TaskError;

  // Event handling
  public readonly events = new EventEmitter<TaskEventListeners>();

  constructor(config: TaskConfig = {}) {
    // Extract input data from config
    const { input = {}, ...rest } = config;
    const inputDefaults = this.inputs.reduce<Record<string, any>>((acc, cur) => {
      if (cur.defaultValue !== undefined) {
        acc[cur.id] = cur.defaultValue;
      }
      return acc;
    }, {});
    this.defaults = Object.assign(inputDefaults, input);
    this.resetInputData();

    // Setup configuration
    const name = new.target.type || new.target.name;
    this.config = Object.assign(
      {
        id: nanoid(),
        name: name,
      },
      rest
    );
    Object.defineProperty(this, "events", { enumerable: false }); // Prevent serialization
  }

  // Input/Output definitions
  public static inputs: readonly TaskInputDefinition[];
  public static outputs: readonly TaskOutputDefinition[];

  get inputs(): TaskInputDefinition[] {
    return ((this.constructor as typeof TaskBase).inputs as TaskInputDefinition[]) ?? [];
  }

  get outputs(): TaskOutputDefinition[] {
    return ((this.constructor as typeof TaskBase).outputs as TaskOutputDefinition[]) ?? [];
  }

  // Event handling methods
  public on<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void {
    this.events.on(name, fn);
  }

  public off<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void {
    this.events.off(name, fn);
  }

  public once<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void {
    this.events.once(name, fn);
  }

  public emitted<Event extends TaskEvents>(name: Event): Promise<TaskEventParameters<Event>> {
    return this.events.emitted(name) as Promise<TaskEventParameters<Event>>;
  }

  public emit<Event extends TaskEvents>(name: Event, ...args: TaskEventParameters<Event>): void {
    this.events.emit(name, ...args);
  }

  // Runtime data
  /**
   * The defaults for the task. If no overrides at run time, then this would be equal to the
   * input
   */
  defaults: TaskInput;
  /**
   * The input to the task at the time of the task run. This takes defaults from construction
   * time and overrides from run time. It is the input that created the output.
   */
  runInputData: TaskInput = {};
  /**
   * The output of the task at the time of the task run. This is the result of the task.
   * The the defaults and overrides are combined to match the required input of the task.
   */
  runOutputData: TaskOutput = {};
  abortController: AbortController | undefined;

  public abort(): void {
    this.abortController?.abort();
  }

  // Core task methods
  public handleStart(): void {
    if (this.status === TaskStatus.PROCESSING) return;
    // this.runOutputData = {};
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

  public handleAbort(): void {
    if (this.status === TaskStatus.ABORTING) return;
    this.status = TaskStatus.ABORTING;
    this.progress = 100;
    this.error = new TaskAbortedError();
    this.events.emit("abort", this.error);
  }

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

  public handleError(err: Error): void {
    if (err instanceof TaskAbortedError) return this.handleAbort();
    if (this.status === TaskStatus.FAILED) return;
    this.completedAt = new Date();
    this.progress = 100;
    // console the stack trace
    this.status = TaskStatus.FAILED;
    this.error =
      err instanceof TaskError ? err : new TaskFailedError(err?.message || "Task failed");
    this.abortController = undefined;
    this.outputCache = undefined;
    this.nodeProvenance = {};
    this.events.emit("error", this.error);
  }

  public handleProgress(progress: number, ...args: any[]): void {
    this.progress = progress;
    this.events.emit("progress", progress);
  }

  public getProvenance(): TaskInput {
    return this.config.provenance ?? {};
  }

  public resetInputData(): void {
    // Use deep clone to avoid state leakage
    try {
      this.runInputData = structuredClone(this.defaults);
    } catch (err) {
      this.runInputData = JSON.parse(JSON.stringify(this.defaults));
    }
  }

  /**
   *
   * ONLY CALLED BY THE TASK RUNNER
   *
   * @param overrides
   * @returns
   */
  public addInputData<T extends TaskInput>(overrides: Partial<T> | undefined): ITask {
    for (const input of this.inputs) {
      if (overrides?.[input.id] !== undefined) {
        let isArray = input.isArray;
        if (
          input.valueType === "any" &&
          (Array.isArray(overrides[input.id]) || Array.isArray(this.runInputData[input.id]))
        ) {
          isArray = true;
        }

        if (isArray) {
          const existingItems = Array.isArray(this.runInputData[input.id])
            ? this.runInputData[input.id]
            : [];
          const newitems = [...existingItems];

          const overrideItem = overrides[input.id];
          if (Array.isArray(overrideItem)) {
            newitems.push(...(overrideItem as any[]));
          } else {
            newitems.push(overrideItem);
          }
          this.runInputData[input.id] = newitems;
        } else {
          this.runInputData[input.id] = overrides[input.id];
        }
      }
    }
    return this;
  }

  /**
   * Validates an item against the task's input definition
   *
   * By default, we only check "number", "text", "boolean", and "function"
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
   * @param input The input to validate
   * @param inputId The id of the input to validate
   * @returns True if the input is valid, otherwise throws an error
   * @throws TaskInvalidInputError if the input is invalid
   */
  public async validateInputItem(
    input: Partial<TaskInput>,
    inputId: keyof TaskInput
  ): Promise<boolean> {
    const classRef = this.constructor as typeof TaskBase;
    const inputdef = this.inputs.find((def) => def.id === inputId);
    if (!inputdef) {
      throw new TaskInvalidInputError(`validateInputItem: Unknown input id: ${inputId}`);
    }
    if (typeof input !== "object") {
      throw new TaskInvalidInputError(`validateInputItem: Input is not an object: ${inputId}`);
    }
    if (input[inputId] === undefined) {
      if (inputdef.defaultValue !== undefined) {
        input[inputId] = inputdef.defaultValue;
      } else {
        if (!inputdef.optional && inputdef.valueType !== "any") {
          throw new TaskInvalidInputError(
            `No default value for '${inputId}' in a ${classRef.type} so assumed required and not given (id:${this.config.id})`
          );
        }
      }
    }

    if (inputdef.isArray && !Array.isArray(input[inputId])) {
      input[inputId] = [input[inputId]];
    }
    const inputlist: any[] = inputdef.isArray ? input[inputId] : [input[inputId]];

    const validationPromises = inputlist.map((item) =>
      this.validateItem(inputdef.valueType as string, item)
    );
    const validationResults = await Promise.all(validationPromises);
    return validationResults.every((result) => result === true);
  }

  /**
   * Validates an input data object against the task's input definition
   * @param input The input to validate
   * @returns True if the input is valid, otherwise throws an error
   * @throws TaskInvalidInputError if the input is invalid
   */
  public async validateInputData(input: Partial<TaskInput>): Promise<boolean> {
    for (const inputdef of this.inputs) {
      if (inputdef.optional && input[inputdef.id] === undefined) continue;
      await this.validateInputItem(input, inputdef.id);
    }
    return true;
  }

  outputCache: TaskOutputRepository | undefined;
  nodeProvenance: Provenance = {};

  /**
   * Run will runFull() and return the output, wrapping the task in a try/catch block.
   */
  async run(
    nodeProvenance: Provenance = {},
    repository?: TaskOutputRepository
  ): Promise<TaskOutput> {
    this.handleStart();
    this.nodeProvenance = nodeProvenance;
    this.outputCache = repository;

    try {
      const isValid = await this.validateInputData(this.runInputData);
      if (!isValid) {
        throw new TaskInvalidInputError("unsure");
      }
      // TODO: erase the following if the error not printed to console
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

  /**
   * Runs the full task
   * @returns The output of the task
   */
  public abstract runFull(): Promise<TaskOutput>;

  /**
   * Runs the task "reactively", defaults to no-op
   * This is generally for UI updating, and should
   * be light weight.
   * @returns The output of the task
   */
  public abstract runReactive(): Promise<TaskOutput>;

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task in JSON format
   */
  public toJSON(): JsonTaskItem {
    const p = this.getProvenance();
    return {
      id: this.config.id,
      type: (this.constructor as typeof TaskBase).type,
      input: this.defaults,
      ...(Object.keys(p).length ? { provenance: p } : {}),
    };
  }
  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task in JSON format
   */
  toDependencyJSON(): JsonTaskItem {
    return this.toJSON();
  }
}
