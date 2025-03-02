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
  Provenance,
} from "./TaskTypes";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskAbortedError, TaskError, TaskFailedError, TaskInvalidInputError } from "./TaskError";

/**
 * Base class for all tasks that implements the ITask interface
 */
export abstract class TaskBase<
  Input extends TaskInput,
  Output extends TaskOutput,
  Config extends TaskConfig,
> implements ITask<Input, Output>
{
  //    ========>     Static properties that should be overridden by subclasses       <=======
  public static readonly type: TaskTypeName = "TaskBase";
  public static readonly category: string = "Hidden";
  public static readonly sideeffects: boolean = false;
  public static readonly inputs: readonly TaskInputDefinition[] = [];
  public static readonly outputs: readonly TaskOutputDefinition[] = [];

  //    ========>         Instance properties to be overridden by subclasses          <=======
  abstract readonly isCompound: boolean;

  /**
   * The defaults for the task. If no overrides at run time, then this would be equal to the
   * input. resetInputData() will reset inputs to these defaults.
   */
  defaults: Partial<Input>;
  /**
   * The input to the task at the time of the task run. This takes defaults from construction
   * time and overrides from run time. It is the input that created the output.
   */
  runInputData: Input = {} as Input;
  /**
   * The output of the task at the time of the task run. This is the result of the task.
   * The the defaults and overrides are combined to match the required input of the task.
   */
  runOutputData: Output = {} as Output;
  /**
   * The configuration of the task. This is the configuration that was used to create the task.
   */

  // Instance properties
  config: Config;
  status: TaskStatus = TaskStatus.PENDING;
  progress: number = 0;
  createdAt: Date = new Date();
  startedAt?: Date;
  completedAt?: Date;
  error?: TaskError;

  // Event handling
  public readonly events = new EventEmitter<TaskEventListeners>();

  constructor(
    callerDefaultInputs: Partial<Input> = {} as Partial<Input>,
    config: Config = {} as Config
  ) {
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
    Object.defineProperty(this, "events", { enumerable: false }); // Prevent serialization
  }

  getDefaultInputsFromStaticInputDefinitions(): Partial<Input> {
    return this.inputs.reduce<Record<string, any>>((acc, cur) => {
      if (cur.defaultValue !== undefined) {
        acc[cur.id] = cur.defaultValue;
      }
      return acc;
    }, {}) as Partial<Input>;
  }

  // Input/Output definitions

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

  public getProvenance(): Provenance {
    return this.config.provenance ?? {};
  }

  public resetInputData(): void {
    // Use deep clone to avoid state leakage
    try {
      this.runInputData = structuredClone(this.defaults) as Input;
    } catch (err) {
      this.runInputData = JSON.parse(JSON.stringify(this.defaults)) as Input;
    }
  }

  public setInput(input: Partial<Input>): void {
    for (const inputdef of this.inputs) {
      const inputId = inputdef.id as keyof Input;
      if (input[inputId] !== undefined) {
        this.runInputData[inputId] = input[inputId];
      }
    }
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
  public async validateInputItem(input: Partial<Input>, inputId: keyof Input): Promise<boolean> {
    const classRef = this.constructor as typeof TaskBase;
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

  outputCache: TaskOutputRepository | undefined;
  nodeProvenance: Provenance = {};

  /**
   * Run will runFull() and return the output, wrapping the task in a try/catch block.
   */
  async run(nodeProvenance: Provenance = {}, repository?: TaskOutputRepository): Promise<Output> {
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
  public abstract runFull(): Promise<Output>;

  /**
   * Runs the task "reactively", defaults to no-op
   * This is generally for UI updating, and should
   * be light weight.
   * @returns The output of the task
   */
  public abstract runReactive(): Promise<Output>;

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
