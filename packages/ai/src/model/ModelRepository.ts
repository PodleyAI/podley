/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { type TabularRepository } from "@workglow/storage";
import { DataPortSchemaObject, EventEmitter, EventParameters } from "@workglow/util";
import { Model } from "./Model";

/**
 * Events that can be emitted by the ModelRepository
 */

export type ModelEventListeners = {
  model_added: (model: Model) => void;
  model_removed: (model: Model) => void;
  task_model_connected: (task: string, model: string) => void;
  task_model_disconnected: (task: string, model: string) => void;
  model_updated: (model: Model) => void;
};

export type ModelEvents = keyof ModelEventListeners;

export type ModelEventListener<Event extends ModelEvents> = ModelEventListeners[Event];

export type ModelEventParameters<Event extends ModelEvents> = EventParameters<
  ModelEventListeners,
  Event
>;

export const ModelSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    details: { type: "string" },
  },
  required: ["name", "details"],
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;
export const ModelPrimaryKeyNames = ["name"] as const;

/**
 * Represents the structure for mapping tasks to models
 */
export const Task2ModelSchema = {
  type: "object",
  properties: {
    task: { type: "string" },
    model: { type: "string" },
  },
  required: ["task", "model"],
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;
export const Task2ModelPrimaryKeyNames = ["task", "model"] as const;

/**
 * Abstract base class for managing AI models and their relationships with tasks.
 * Provides functionality for storing, retrieving, and managing the lifecycle of models
 * and their associations with specific tasks.
 */
export abstract class ModelRepository {
  /** Repository type identifier */
  public type = "ModelRepository";

  /**
   * Repository for storing and managing Model instances
   */
  abstract modelTabularRepository: TabularRepository<
    typeof ModelSchema,
    typeof ModelPrimaryKeyNames
  >;

  /**
   * Repository for managing relationships between tasks and models
   */
  abstract task2ModelTabularRepository: TabularRepository<
    typeof Task2ModelSchema,
    typeof Task2ModelPrimaryKeyNames
  >;

  /** Event emitter for repository events */
  protected events = new EventEmitter<ModelEventListeners>();

  /**
   * Registers an event listener for the specified event
   * @param name - The event name to listen for
   * @param fn - The callback function to execute when the event occurs
   */
  on<Event extends ModelEvents>(name: Event, fn: ModelEventListener<Event>) {
    this.events.on(name, fn);
  }

  /**
   * Removes an event listener for the specified event
   * @param name - The event name to stop listening for
   * @param fn - The callback function to remove
   */
  off<Event extends ModelEvents>(name: Event, fn: ModelEventListener<Event>) {
    this.events.off(name, fn);
  }

  /**
   * Adds an event listener that will only be called once
   * @param name - The event name to listen for
   * @param fn - The callback function to execute when the event occurs
   */
  once<Event extends ModelEvents>(name: Event, fn: ModelEventListener<Event>) {
    this.events.once(name, fn);
  }

  /**
   * Returns when the event was emitted (promise form of once)
   * @param name - The event name to check
   * @returns a promise that resolves to the event listener parameters
   */
  waitOn<Event extends ModelEvents>(name: Event) {
    return this.events.waitOn(name);
  }

  /**
   * Adds a new model to the repository
   * @param model - The model instance to add
   */
  async addModel(model: Model) {
    await this.modelTabularRepository.put({ name: model.name, details: JSON.stringify(model) });
    this.models.set(model.name, model);
    this.events.emit("model_added", model);
    return model;
  }

  /**
   * Finds all models associated with a specific task
   * @param task - The task identifier to search for
   * @returns Promise resolving to an array of associated models, or undefined if none found
   */
  async findModelsByTask(task: string) {
    if (typeof task != "string") return undefined;
    const junctions = await this.task2ModelTabularRepository.search({ task });
    if (!junctions || junctions.length === 0) return undefined;
    const models = [];
    for (const junction of junctions) {
      const model = await this.modelTabularRepository.get({ name: junction.model } as any);
      if (model) models.push(JSON.parse(model.details as string));
    }
    models.forEach((m) => this.models.set(m.name, m));
    this.taskModels.set(task, models);
    return models;
  }

  models = new Map<string, Model>();
  taskModels = new Map<string, Model[]>();

  /**
   * Finds all tasks associated with a specific model
   * @param model - The model identifier to search for
   * @returns Promise resolving to an array of associated tasks, or undefined if none found
   */
  async findTasksByModel(model: string) {
    if (typeof model != "string") return undefined;
    const junctions = await this.task2ModelTabularRepository.search({ model });
    if (!junctions || junctions.length === 0) return undefined;
    return junctions.map((junction) => junction.task);
  }

  /**
   * Enumerates all tasks in the repository
   * @returns Promise resolving to an array of task identifiers
   */
  async enumerateAllTasks() {
    const junctions = await this.task2ModelTabularRepository.getAll();
    if (!junctions || junctions.length === 0) return undefined;
    const uniqueTasks = [...new Set(junctions.map((junction) => junction.task))];
    return uniqueTasks;
  }

  /**
   * Enumerates all models in the repository
   * @returns Promise resolving to an array of model instances
   */
  async enumerateAllModels() {
    const models = await this.modelTabularRepository.getAll();
    if (!models || models.length === 0) return undefined;
    const parsedModels = models.map((model) => JSON.parse(model.details as string));
    parsedModels.forEach((m) => this.models.set(m.name, m));
    return parsedModels;
  }

  /**
   * Creates an association between a task and a model
   * @param task - The task identifier
   * @param model - The model to associate with the task
   */
  async connectTaskToModel(task: string, model: string) {
    await this.task2ModelTabularRepository.put({ task, model });
    this.events.emit("task_model_connected", task, model);
  }

  /**
   * Retrieves a model by its name
   * @param name - The name of the model to find
   * @returns Promise resolving to the found model or undefined if not found
   */
  async findByName(name: string) {
    if (typeof name != "string") return undefined;
    const modelstr = await this.modelTabularRepository.get({ name } as any);
    if (!modelstr) return undefined;
    const model = JSON.parse(modelstr.details as string);
    this.models.set(model.name, model);
    return model;
  }

  /**
   * Gets the total number of models in the repository
   * @returns Promise resolving to the number of stored models
   */
  async size(): Promise<number> {
    return await this.modelTabularRepository.size();
  }

  /**
   * Clears all models from the repository
   */
  async clear() {
    await this.modelTabularRepository.deleteAll();
  }
}
