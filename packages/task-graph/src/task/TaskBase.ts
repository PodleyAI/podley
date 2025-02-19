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
} from "./TaskTypes";

/**
 * Base class for all tasks
 */

export abstract class TaskBase {
  // information about the task that should be overriden by the subclasses
  static readonly type: TaskTypeName = "TaskBase";
  static readonly category: string = "Hidden";
  static readonly sideeffects: boolean = false;

  get inputs(): TaskInputDefinition[] {
    return ((this.constructor as typeof TaskBase).inputs as TaskInputDefinition[]) ?? [];
  }
  get outputs(): TaskOutputDefinition[] {
    return ((this.constructor as typeof TaskBase).outputs as TaskOutputDefinition[]) ?? [];
  }

  public events = new EventEmitter<TaskEventListeners>();
  public on<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>) {
    this.events.on(name, fn);
  }
  public off<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>) {
    this.events.off(name, fn);
  }
  public once<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>) {
    this.events.once(name, fn);
  }
  public emitted<Event extends TaskEvents>(name: Event) {
    return this.events.emitted(name) as Promise<TaskEventParameters<Event>>;
  }
  public emit<Event extends TaskEvents>(name: Event, ...args: TaskEventParameters<Event>) {
    this.events.emit(name, ...args);
  }

  /**
   * Does this task have subtasks?
   */
  abstract readonly isCompound: boolean;
  /**
   * Configuration for the task, might include things like name and id for the database
   */
  config: IConfig;
  status: TaskStatus = TaskStatus.PENDING;
  progress: number = 0;
  createdAt: Date = new Date();
  startedAt?: Date;
  completedAt?: Date;
  error?: string;

  constructor(config: TaskConfig = {}) {
    // pull out input data from the config
    const { input = {}, ...rest } = config;
    const inputDefaults = this.inputs.reduce<Record<string, any>>((acc, cur) => {
      if (cur.defaultValue !== undefined) {
        acc[cur.id] = cur.defaultValue;
      }
      return acc;
    }, {});
    this.defaults = Object.assign(inputDefaults, input);
    this.resetInputData();

    // setup the configuration
    const name = new.target.type || new.target.name;
    this.config = Object.assign(
      {
        id: nanoid(),
        name: name,
      },
      rest
    );
    Object.defineProperty(this, "events", { enumerable: false }); // in case it is serialized
  }

  public handleStart() {
    this.startedAt = new Date();
    this.progress = 0;
    this.status = TaskStatus.PROCESSING;
    this.events.emit("start");
  }

  public handleComplete() {
    this.completedAt = new Date();
    this.progress = 100;
    this.status = TaskStatus.COMPLETED;
    this.events.emit("complete");
  }

  public handleError(err: any) {
    this.completedAt = new Date();
    this.progress = 100;
    this.status = TaskStatus.FAILED;
    this.error = err?.message || "Task failed";
    this.events.emit("error", this.error!);
  }

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

  public static inputs: readonly TaskInputDefinition[];
  public static outputs: readonly TaskOutputDefinition[];

  /**
   *
   * @returns TaskInput Values that are used by the task runner, usually for storing results
   */
  getProvenance(): TaskInput {
    return this.config.provenance ?? {};
  }

  resetInputData() {
    // Use deep clone to avoid state leakage.
    if (typeof structuredClone === "function") {
      this.runInputData = structuredClone(this.defaults);
    } else {
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
  addInputData<T extends TaskInput>(overrides: Partial<T> | undefined) {
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
          // Initialize newitems as an empty array if runInputData[input.id] is not an array
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
   * @returns True if the item is valid, false otherwise
   */
  async validateItem(valueType: string, item: any) {
    switch (valueType) {
      case "any":
        return true;
      case "number":
        return typeof item === "bigint" || typeof item === "number";
      case "text":
        return typeof item === "string";
      case "boolean":
        return typeof item === "boolean";
      case "function":
        return typeof item === "function";
      default:
        console.warn(`validateItem: Unknown value type: ${valueType}`);
        return false;
    }
  }

  /**
   * Validates an input item against the task's input definition
   * @param input The input to validate
   * @param inputId The id of the input to validate
   * @returns True if the input is valid, false otherwise
   */
  async validateInputItem(input: Partial<TaskInput>, inputId: keyof TaskInput) {
    const classRef = this.constructor as typeof TaskBase;
    const inputdef = this.inputs.find((def) => def.id === inputId);
    if (!inputdef) {
      return false;
    }
    if (typeof input !== "object") return false;
    if (inputdef.defaultValue !== undefined && input[inputId] === undefined) {
      // if there is no default value, that implies the value is required
      console.warn(
        `No default value for '${inputId}' in a ${classRef.type} so assumed required and not given (id:${this.config.id})`
      );
      return false;
    } else if (input[inputId] === undefined) {
      input[inputId] = inputdef.defaultValue;
    }
    if (inputdef.isArray && !Array.isArray(input[inputId])) {
      input[inputId] = [input[inputId]];
    }

    const inputlist: any[] = inputdef.isArray ? input[inputId] : [input[inputId]];

    // Rewritten using Promise.all for asynchronous validation
    const validationPromises = inputlist.map((item) =>
      this.validateItem(inputdef.valueType as string, item)
    );
    const validationResults = await Promise.all(validationPromises);
    return validationResults.every(Boolean);
  }

  /**
   * Validates an input data object against the task's input definition
   * @param input The input to validate
   * @returns True if the input is valid, false otherwise
   */
  async validateInputData(input: Partial<TaskInput>) {
    for (const inputdef of this.inputs) {
      if ((await this.validateInputItem(input, inputdef.id)) === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Runs the task
   * @returns The output of the task
   */
  async run(): Promise<TaskOutput> {
    if (!(await this.validateInputData(this.runInputData))) {
      throw new Error("Invalid input data");
    }
    if (this.status === TaskStatus.ABORTING) {
      throw new Error("Task aborted by run time");
    }

    this.handleStart();

    try {
      const result = await this.runReactive();
      this.runOutputData = result;

      this.handleComplete();
      return result;
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
  }
  /**
   * Runs the task reactively
   * @returns The output of the task
   */
  async runReactive(): Promise<TaskOutput> {
    return this.runOutputData;
  }

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task in JSON format
   */
  toJSON(): JsonTaskItem {
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

  /**
   * Aborts the task
   * @returns A promise that resolves when the task is aborted
   */
  async abort(): Promise<void> {
    this.progress = 100;
    this.status = TaskStatus.ABORTING;
    this.error = "Task aborted by run time";
    this.events.emit("abort", this.error);
  }
}
