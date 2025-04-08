//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, EventEmitter, EventParameters } from "@ellmers/util";
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

/**
 * Abstract class for managing task outputs in a repository
 * Provides methods for saving, retrieving, and clearing task outputs
 */
export abstract class TaskOutputRepository {
  /**
   * Whether to compress the output
   */
  outputCompression: boolean;

  /**
   * Constructor for the TaskOutputRepository
   * @param options The options for the repository
   */
  constructor({ outputCompression = true }) {
    this.outputCompression = outputCompression;
  }

  private get events() {
    if (!this._events) {
      this._events = new EventEmitter<TaskOutputEventListeners>();
    }
    return this._events;
  }
  private _events: EventEmitter<TaskOutputEventListeners> | undefined;

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
   * Emits an event (if there are listeners)
   * @param name The event name to emit
   * @param args The event parameters
   */
  emit<Event extends TaskOutputEvents>(name: Event, ...args: TaskOutputEventParameters<Event>) {
    this._events?.emit(name, ...args);
  }

  /**
   * Saves a task output to the repository
   * @param taskType The type of task to save the output for
   * @param inputs The input parameters for the task
   * @param output The task output to save
   */
  abstract saveOutput(
    taskType: string,
    inputs: TaskInput,
    output: TaskOutput,
    createdAt?: Date // for testing purposes
  ): Promise<void>;

  /**
   * Retrieves a task output from the repository
   * @param taskType The type of task to retrieve the output for
   * @param inputs The input parameters for the task
   * @returns The retrieved task output, or undefined if not found
   */
  abstract getOutput(taskType: string, inputs: TaskInput): Promise<TaskOutput | undefined>;

  /**
   * Clears all task outputs from the repository
   * @emits output_cleared when the operation completes
   */
  abstract clear(): Promise<void>;

  /**
   * Returns the number of task outputs stored in the repository
   * @returns The count of stored task outputs
   */
  abstract size(): Promise<number>;

  /**
   * Clear all task outputs from the repository that are older than the given date
   * @param olderThanInMs The time in milliseconds to clear task outputs older than
   */
  abstract clearOlderThan(olderThanInMs: number): Promise<void>;
}
