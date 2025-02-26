//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter, EventParameters } from "@ellmers/util";
import type { TabularRepository } from "@ellmers/storage";
import { DataFlow } from "../../task-graph/DataFlow";
import { TaskGraph, TaskGraphItemJson, TaskGraphJson } from "../../task-graph/TaskGraph";
import { CompoundTask } from "../../task/CompoundTask";
import { TaskRegistry } from "../../task/TaskRegistry";
import { TaskConfigurationError } from "../../task/TaskError";

/**
 * Events that can be emitted by the TaskGraphRepository
 */
export type TaskGraphEvents = keyof TaskGraphEventListeners;

export type TaskGraphEventListeners = {
  graph_saved: (key: string) => void;
  graph_retrieved: (key: string) => void;
  graph_cleared: () => void;
};

export type TaskGraphEventListener<Event extends TaskGraphEvents> = TaskGraphEventListeners[Event];

export type TaskGraphEventParameters<Event extends TaskGraphEvents> = EventParameters<
  TaskGraphEventListeners,
  Event
>;

/**
 * Abstract repository class for managing task graphs persistence and retrieval.
 * Provides functionality to save, load, and manipulate task graphs with their associated tasks and data flows.
 */
export abstract class TaskGraphRepository {
  public type = "TaskGraphRepository";
  abstract tabularRepository: TabularRepository;
  protected events = new EventEmitter<TaskGraphEventListeners>();

  /**
   * Registers an event listener for the specified event
   * @param name The event name to listen for
   * @param fn The callback function to execute when the event occurs
   */
  on<Event extends TaskGraphEvents>(name: Event, fn: TaskGraphEventListener<Event>) {
    this.events.on(name, fn);
  }

  /**
   * Removes an event listener for the specified event
   * @param name The event name to stop listening for
   * @param fn The callback function to remove
   */
  off<Event extends TaskGraphEvents>(name: Event, fn: TaskGraphEventListener<Event>) {
    this.events.off(name, fn);
  }

  /**
   * Adds an event listener that will only be called once
   * @param name The event name to listen for
   * @param fn The callback function to execute when the event occurs
   */
  once<Event extends TaskGraphEvents>(name: Event, fn: TaskGraphEventListener<Event>) {
    this.events.once(name, fn);
  }

  /**
   * Returns when the event was emitted (promise form of once)
   * @param name The event name to check
   * @returns true if the event has listeners, false otherwise
   */
  emitted<Event extends TaskGraphEvents>(name: Event) {
    return this.events.emitted(name) as Promise<TaskGraphEventParameters<Event>>;
  }

  /**
   * Creates a task instance from a task graph item JSON representation
   * @param item The JSON representation of the task
   * @returns A new task instance
   * @throws Error if required fields are missing or invalid
   */
  private createTask(item: TaskGraphItemJson) {
    if (!item.id) throw new TaskConfigurationError("Task id required");
    if (!item.type) throw new TaskConfigurationError("Task type required");
    if (item.input && (Array.isArray(item.input) || Array.isArray(item.provenance)))
      throw new TaskConfigurationError("Task input must be an object");
    if (item.provenance && (Array.isArray(item.provenance) || typeof item.provenance !== "object"))
      throw new TaskConfigurationError("Task provenance must be an object");

    const taskClass = TaskRegistry.all.get(item.type);
    if (!taskClass) throw new TaskConfigurationError(`Task type ${item.type} not found`);

    const taskConfig = {
      id: item.id,
      name: item.name,
      input: item.input ?? {},
      provenance: item.provenance ?? {},
    };
    const task = new taskClass(taskConfig);
    if (item.subgraph) {
      (task as CompoundTask).subGraph = this.createSubGraph(item.subgraph);
    }
    return task;
  }

  /**
   * Creates a TaskGraph instance from its JSON representation
   * @param graphJsonObj The JSON representation of the task graph
   * @returns A new TaskGraph instance with all tasks and data flows
   */
  public createSubGraph(graphJsonObj: TaskGraphJson) {
    const subGraph = new TaskGraph();
    for (const subitem of graphJsonObj.nodes) {
      subGraph.addTask(this.createTask(subitem));
    }
    for (const subitem of graphJsonObj.edges) {
      subGraph.addDataFlow(
        new DataFlow(
          subitem.sourceTaskId,
          subitem.sourceTaskOutputId,
          subitem.targetTaskId,
          subitem.targetTaskInputId
        )
      );
    }
    return subGraph;
  }

  /**
   * Saves a task graph to persistent storage
   * @param key The unique identifier for the task graph
   * @param output The task graph to save
   * @emits graph_saved when the operation completes
   */
  async saveTaskGraph(key: string, output: TaskGraph): Promise<void> {
    const value = JSON.stringify(output.toJSON());
    await this.tabularRepository.putKeyValue({ key }, { value });
    this.events.emit("graph_saved", key);
  }

  /**
   * Retrieves a task graph from persistent storage
   * @param key The unique identifier of the task graph to retrieve
   * @returns The retrieved task graph, or undefined if not found
   * @emits graph_retrieved when the operation completes successfully
   */
  async getTaskGraph(key: string): Promise<TaskGraph | undefined> {
    const result = await this.tabularRepository.getKeyValue({ key });
    const value = result?.value;
    if (!value) {
      return undefined;
    }
    const jsonObj = JSON.parse(value);

    const graph = this.createSubGraph(jsonObj);

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
