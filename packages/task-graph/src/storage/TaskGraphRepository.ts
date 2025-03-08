//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter, EventParameters } from "@ellmers/util";
import type { TabularRepository } from "@ellmers/storage";
import { TaskGraph } from "../task-graph/TaskGraph";
import { createGraphFromGraphJSON } from "../task/TaskJSON";

/**
 * Events that can be emitted by the TaskGraphRepository
 */
export type TaskGraphRepositoryEvents = keyof TaskGraphRepositoryEventListeners;

export type TaskGraphRepositoryEventListeners = {
  graph_saved: (key: string) => void;
  graph_retrieved: (key: string) => void;
  graph_cleared: () => void;
};

export type TaskGraphRepositoryEventListener<Event extends TaskGraphRepositoryEvents> =
  TaskGraphRepositoryEventListeners[Event];

export type TaskGraphRepositoryEventParameters<Event extends TaskGraphRepositoryEvents> =
  EventParameters<TaskGraphRepositoryEventListeners, Event>;

export const TaskGraphSchema = {
  key: "string",
  value: "string",
} as const;

export const TaskGraphPrimaryKeyNames = ["key"] as const;

/**
 * Options for the TaskGraphRepository
 */
export type TaskGraphRepositoryStorage = TabularRepository<
  typeof TaskGraphSchema,
  typeof TaskGraphPrimaryKeyNames
>;
type TaskGraphRepositoryOptions = {
  tabularRepository: TaskGraphRepositoryStorage;
};

/**
 * Repository class for managing task graphs persistence and retrieval.
 * Provides functionality to save, load, and manipulate task graphs with their associated tasks and data flows.
 */
export class TaskGraphRepository {
  /**
   * The type of the repository
   */
  public type = "TaskGraphRepository";

  /**
   * The tabular repository for the task graphs
   */
  tabularRepository: TaskGraphRepositoryStorage;

  /**
   * Constructor for the TaskGraphRepository
   * @param options The options for the repository
   */
  constructor({ tabularRepository }: TaskGraphRepositoryOptions) {
    this.tabularRepository = tabularRepository;
  }

  /**
   * The event emitter for the task graphs
   */
  protected events = new EventEmitter<TaskGraphRepositoryEventListeners>();

  /**
   * Registers an event listener for the specified event
   * @param name The event name to listen for
   * @param fn The callback function to execute when the event occurs
   */
  on<Event extends TaskGraphRepositoryEvents>(
    name: Event,
    fn: TaskGraphRepositoryEventListener<Event>
  ) {
    this.events.on(name, fn);
  }

  /**
   * Removes an event listener for the specified event
   * @param name The event name to stop listening for
   * @param fn The callback function to remove
   */
  off<Event extends TaskGraphRepositoryEvents>(
    name: Event,
    fn: TaskGraphRepositoryEventListener<Event>
  ) {
    this.events.off(name, fn);
  }

  /**
   * Adds an event listener that will only be called once
   * @param name The event name to listen for
   * @param fn The callback function to execute when the event occurs
   */
  once<Event extends TaskGraphRepositoryEvents>(
    name: Event,
    fn: TaskGraphRepositoryEventListener<Event>
  ) {
    this.events.once(name, fn);
  }

  /**
   * Returns when the event was emitted (promise form of once)
   * @param name The event name to check
   * @returns true if the event has listeners, false otherwise
   */
  waitOn<Event extends TaskGraphRepositoryEvents>(name: Event) {
    return this.events.waitOn(name) as Promise<TaskGraphRepositoryEventParameters<Event>>;
  }

  /**
   * Saves a task graph to persistent storage
   * @param key The unique identifier for the task graph
   * @param output The task graph to save
   * @emits graph_saved when the operation completes
   */
  async saveTaskGraph(key: string, output: TaskGraph): Promise<void> {
    const value = JSON.stringify(output.toJSON());
    await this.tabularRepository.put({ key, value });
    this.events.emit("graph_saved", key);
  }

  /**
   * Retrieves a task graph from persistent storage
   * @param key The unique identifier of the task graph to retrieve
   * @returns The retrieved task graph, or undefined if not found
   * @emits graph_retrieved when the operation completes successfully
   */
  async getTaskGraph(key: string): Promise<TaskGraph | undefined> {
    const result = await this.tabularRepository.get({ key });
    const value = result?.value;
    if (!value) {
      return undefined;
    }
    const jsonObj = JSON.parse(value);
    const graph = createGraphFromGraphJSON(jsonObj);

    this.events.emit("graph_retrieved", key);
    return graph;
  }

  /**
   * Clears all task graphs from the repository
   * @emits graph_cleared when the operation completes
   */
  async clear(): Promise<void> {
    await this.tabularRepository.deleteAll();
    this.events.emit("graph_cleared");
  }

  /**
   * Returns the number of task graphs stored in the repository
   * @returns The count of stored task graphs
   */
  async size(): Promise<number> {
    return await this.tabularRepository.size();
  }
}
