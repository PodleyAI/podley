//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { TabularRepository } from "@podley/storage";
import { Type } from "@sinclair/typebox";
import { TaskGraph } from "../task-graph/TaskGraph";
import { createGraphFromGraphJSON } from "../task/TaskJSON";
import { TaskGraphRepository } from "./TaskGraphRepository";

export const TaskGraphSchema = Type.Object({
  key: Type.String(),
  value: Type.String(),
});

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
export class TaskGraphTabularRepository extends TaskGraphRepository {
  /**
   * The type of the repository
   */
  public type = "TaskGraphTabularRepository";

  /**
   * The tabular repository for the task graphs
   */
  tabularRepository: TaskGraphRepositoryStorage;

  /**
   * Constructor for the TaskGraphRepository
   * @param options The options for the repository
   */
  constructor({ tabularRepository }: TaskGraphRepositoryOptions) {
    super();
    this.tabularRepository = tabularRepository;
  }

  /**
   * Sets up the database for the task graph repository
   */
  async setupDatabase(): Promise<void> {
    await this.tabularRepository.setupDatabase();
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
    this.emit("graph_saved", key);
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

    this.emit("graph_retrieved", key);
    return graph;
  }

  /**
   * Clears all task graphs from the repository
   * @emits graph_cleared when the operation completes
   */
  async clear(): Promise<void> {
    await this.tabularRepository.deleteAll();
    this.emit("graph_cleared");
  }

  /**
   * Returns the number of task graphs stored in the repository
   * @returns The count of stored task graphs
   */
  async size(): Promise<number> {
    return await this.tabularRepository.size();
  }
}
