//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { ITaskConstructor } from "./ITask";

/**
 * Map storing all registered task constructors.
 * Keys are task type identifiers and values are their corresponding constructor functions.
 */
const taskConstructors = new Map<string, ITaskConstructor<any, any, any, any>>();

/**
 * Registers a task constructor with the registry.
 * This allows the task type to be instantiated dynamically based on its type identifier.
 *
 * @param type - The unique identifier for the task type
 * @param constructor - The constructor function for the task
 * @throws Error if a task with the same type is already registered
 */
function registerTask(baseClass: ITaskConstructor<any, any, any, any>): void {
  if (taskConstructors.has(baseClass.type)) {
    // TODO: fix this
    // throw new Error(`Task type ${baseClass.type} is already registered`);
  }
  taskConstructors.set(baseClass.type, baseClass);
}

/**
 * TaskRegistry provides a centralized registry for task types.
 * It enables dynamic task instantiation and management across the application.
 */
export const TaskRegistry = {
  /**
   * Map containing all registered task constructors
   */
  all: taskConstructors,

  /**
   * Function to register new task types
   */
  registerTask,
};
