//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter, EventParameters } from "@ellmers/util";
import { DefaultValueType, type KVRepository } from "@ellmers/storage";
import { makeFingerprint } from "@ellmers/util";
import { TaskInput, TaskOutput } from "../../task/Task";

export type TaskOutputEventListeners = {
  output_saved: (taskType: string) => void;
  output_retrieved: (taskType: string) => void;
  output_cleared: () => void;
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

export const TaskOutputPrimaryKeySchema = {
  key: "string",
  taskType: "string",
} as const;

/**
 * Abstract class for managing task outputs in a repository
 * Provides methods for saving, retrieving, and clearing task outputs
 */
export abstract class TaskOutputRepository {
  public type = "TaskOutputRepository";
  abstract kvRepository: KVRepository<TaskOutputPrimaryKey, DefaultValueType>;
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
  emitted<Event extends TaskOutputEvents>(name: Event) {
    return this.events.emitted(name) as Promise<TaskOutputEventParameters<Event>>;
  }

  /**
   * Saves a task output to the repository
   * @param taskType The type of task to save the output for
   * @param inputs The input parameters for the task
   * @param output The task output to save
   */
  async saveOutput(taskType: string, inputs: TaskInput, output: TaskOutput): Promise<void> {
    const key = await makeFingerprint(inputs);
    const value = JSON.stringify(output);
    await this.kvRepository.putKeyValue({ key, taskType }, { value: value });
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
    const output = await this.kvRepository.getKeyValue({ key, taskType });
    this.events.emit("output_retrieved", taskType);
    return output ? (JSON.parse(output["value"]) as TaskOutput) : undefined;
  }

  /**
   * Clears all task outputs from the repository
   * @emits output_cleared when the operation completes
   */
  async clear(): Promise<void> {
    await this.kvRepository.deleteAll();
    this.events.emit("output_cleared");
  }

  /**
   * Returns the number of task outputs stored in the repository
   * @returns The count of stored task outputs
   */
  async size(): Promise<number> {
    return await this.kvRepository.size();
  }
}
