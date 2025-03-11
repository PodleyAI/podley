//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  compress,
  createServiceToken,
  decompress,
  EventEmitter,
  EventParameters,
} from "@ellmers/util";
import { type TabularRepository } from "@ellmers/storage";
import { makeFingerprint } from "@ellmers/util";
import { TaskInput, TaskOutput } from "../task/TaskTypes";

/**
 * Service token for TaskOutputRepository
 */
export const TASK_OUTPUT_REPOSITORY = createServiceToken<TaskOutputRepository>(
  "taskgraph.taskOutputRepository"
);

export type TaskOutputEventListeners = {
  output_saved: (taskType: string) => void;
  output_retrieved: (taskType: string) => void;
  output_cleared: () => void;
  output_pruned: () => void;
};

export type TaskOutputEvents = keyof TaskOutputEventListeners;

export type TaskOutputEventListener<Event extends TaskOutputEvents> =
  TaskOutputEventListeners[Event];

export type TaskOutputEventParameters<Event extends TaskOutputEvents> = EventParameters<
  TaskOutputEventListeners,
  Event
>;

export type TaskOutputPrimaryKey = {
  key: string;
  taskType: string;
};

export const TaskOutputSchema = {
  key: "string",
  taskType: "string",
  value: "blob",
  createdAt: "date",
} as const;

export const TaskOutputPrimaryKeyNames = ["key", "taskType"] as const;

export type TaskOutputRepositoryStorage = TabularRepository<
  typeof TaskOutputSchema,
  typeof TaskOutputPrimaryKeyNames
>;

export type TaskOutputRepositoryOptions = {
  tabularRepository: TaskOutputRepositoryStorage;
  outputCompression?: boolean;
};

/**
 * Abstract class for managing task outputs in a repository
 * Provides methods for saving, retrieving, and clearing task outputs
 */
export abstract class TaskOutputRepository {
  /**
   * The tabular repository for the task outputs
   */
  tabularRepository: TaskOutputRepositoryStorage;

  /**
   * Whether to compress the output
   */
  outputCompression: boolean;

  /**
   * Constructor for the TaskOutputRepository
   * @param options The options for the repository
   */
  constructor({ tabularRepository, outputCompression = true }: TaskOutputRepositoryOptions) {
    this.tabularRepository = tabularRepository;
    this.outputCompression = outputCompression;
  }

  /**
   * The event emitter for the task outputs */
  protected events = new EventEmitter<TaskOutputEventListeners>();

  /**
   * Registers an event listener for a specific event
   * @param name The event name to listen for
   * @param fn The callback function to execute when the event occurs
   */
  on<Event extends TaskOutputEvents>(name: Event, fn: TaskOutputEventListener<Event>) {
    this.events.on(name, fn);
  }

  /**
   * Removes an event listener for a specific event
   * @param name The event name to stop listening for
   * @param fn The callback function to remove
   */
  off<Event extends TaskOutputEvents>(name: Event, fn: TaskOutputEventListener<Event>) {
    this.events.off(name, fn);
  }

  /**
   * Returns a promise that resolves when the event is emitted
   * @param name The event name to listen for
   * @returns a promise that resolves to the event parameters
   */
  waitOn<Event extends TaskOutputEvents>(name: Event) {
    return this.events.waitOn(name) as Promise<TaskOutputEventParameters<Event>>;
  }

  /**
   * Saves a task output to the repository
   * @param taskType The type of task to save the output for
   * @param inputs The input parameters for the task
   * @param output The task output to save
   */
  async saveOutput(
    taskType: string,
    inputs: TaskInput,
    output: TaskOutput,
    createdAt = new Date() // for testing purposes
  ): Promise<void> {
    const key = await makeFingerprint(inputs);
    const value = JSON.stringify(output);
    if (this.outputCompression) {
      const compressedValue = await compress(value);
      await this.tabularRepository.put({
        taskType,
        key,
        value: compressedValue,
        createdAt: createdAt,
      });
    } else {
      const valueBuffer = Buffer.from(value);
      await this.tabularRepository.put({
        taskType,
        key,
        value: valueBuffer,
        createdAt: createdAt,
      });
    }
    this.events.emit("output_saved", taskType);
  }

  /**
   * Retrieves a task output from the repository
   * @param taskType The type of task to retrieve the output for
   * @param inputs The input parameters for the task
   * @returns The retrieved task output, or undefined if not found
   */
  async getOutput(taskType: string, inputs: TaskInput): Promise<TaskOutput | undefined> {
    const key = await makeFingerprint(inputs);
    const output = await this.tabularRepository.get({ key, taskType });
    this.events.emit("output_retrieved", taskType);
    if (output?.value) {
      if (this.outputCompression) {
        const decompressedValue = await decompress(output.value);
        const value = JSON.parse(decompressedValue) as TaskOutput;
        return value as TaskOutput;
      } else {
        const stringValue = output.value.toString();
        const value = JSON.parse(stringValue) as TaskOutput;
        return value as TaskOutput;
      }
    } else {
      return undefined;
    }
  }

  /**
   * Clears all task outputs from the repository
   * @emits output_cleared when the operation completes
   */
  async clear(): Promise<void> {
    await this.tabularRepository.deleteAll();
    this.events.emit("output_cleared");
  }

  /**
   * Returns the number of task outputs stored in the repository
   * @returns The count of stored task outputs
   */
  async size(): Promise<number> {
    return await this.tabularRepository.size();
  }

  /**
   * Clear all task outputs from the repository that are older than the given date
   * @param olderThanInMs The time in milliseconds to clear task outputs older than
   */
  async clearOlderThan(olderThanInMs: number): Promise<void> {
    const date = new Date(Date.now() - olderThanInMs);
    await this.tabularRepository.deleteSearch("createdAt", date, "<");
    this.events.emit("output_pruned");
  }
}
