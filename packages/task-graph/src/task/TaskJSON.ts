// //    *******************************************************************************
// //    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
// //    *                                                                             *
// //    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
// //    *   Licensed under the Apache License, Version 2.0 (the "License");           *
// //    *******************************************************************************

import { TaskInput, Provenance, TaskConfig } from "./TaskTypes";
import { TaskRegistry } from "../task/TaskRegistry";
import { TaskConfigurationError, TaskJSONError } from "../task/TaskError";
import { TaskGraph } from "../task-graph/TaskGraph";
import { Dataflow } from "../task-graph/Dataflow";
import { CompoundMergeStrategy } from "../task-graph/TaskGraphRunner";
import { GraphAsTask } from "./GraphAsTask";

// ========================================================================
// JSON Serialization Types
// ========================================================================
/**
 * Represents a single task item in the JSON configuration.
 * This structure defines how tasks should be configured in JSON format.
 */

export type JsonTaskItem = {
  /** Unique identifier for the task */
  id: unknown;

  /** Type of task to create */
  type: string;

  /** Optional display name for the task */
  name?: string;

  /** Input configuration for the task */
  input?: TaskInput;

  /** Defines data flow between tasks */
  dependencies?: {
    /** Input parameter name mapped to source task output */
    [x: string]:
      | {
          /** ID of the source task */
          id: unknown;

          /** Output parameter name from source task */
          output: string;
        }
      | Array<{
          id: unknown;
          output: string;
        }>;
  };

  /** Optional metadata about task origin */
  provenance?: Provenance;

  /** Nested tasks for compound operations */
  subtasks?: JsonTaskItem[];
}; /**
 * Represents a task graph item, which can be a task or a subgraph
 */

export type TaskGraphItemJson = {
  id: unknown;
  type: string;
  name?: string;
  input?: TaskInput;
  provenance?: Provenance;
  subgraph?: TaskGraphJson;
  merge?: CompoundMergeStrategy;
};

export type TaskGraphJson = {
  tasks: TaskGraphItemJson[];
  dataflows: DataflowJson[];
};

export type DataflowJson = {
  sourceTaskId: unknown;
  sourceTaskPortId: string;
  targetTaskId: unknown;
  targetTaskPortId: string;
};

const createSingleTaskFromJSON = (item: JsonTaskItem | TaskGraphItemJson) => {
  if (!item.id) throw new TaskJSONError("Task id required");
  if (!item.type) throw new TaskJSONError("Task type required");
  if (item.input && (Array.isArray(item.input) || Array.isArray(item.provenance)))
    throw new TaskJSONError("Task input must be an object");
  if (item.provenance && (Array.isArray(item.provenance) || typeof item.provenance !== "object"))
    throw new TaskJSONError("Task provenance must be an object");

  const taskClass = TaskRegistry.all.get(item.type);
  if (!taskClass)
    throw new TaskJSONError(`Task type ${item.type} not found, perhaps not registered?`);

  const taskConfig: TaskConfig = {
    id: item.id,
    name: item.name,
    provenance: item.provenance ?? {},
  };
  const task = new taskClass(item.input ?? {}, taskConfig);
  return task;
};

/**
 * Creates a task instance from a JSON task item configuration
 * Validates required fields and resolves task type from registry
 */
export const createTaskFromDependencyJSON = (item: JsonTaskItem) => {
  const task = createSingleTaskFromJSON(item);
  if (item.subtasks) {
    if (!(task instanceof GraphAsTask)) {
      throw new TaskConfigurationError("Subgraph is only supported for CompoundTasks");
    }
    task.subGraph = createGraphFromDependencyJSON(item.subtasks);
  }
  return task;
};

/**
 * Creates a task graph from an array of JSON task items
 * Recursively processes subtasks for compound tasks
 */
export const createGraphFromDependencyJSON = (jsonItems: JsonTaskItem[]) => {
  const subGraph = new TaskGraph();
  for (const subitem of jsonItems) {
    subGraph.addTask(createTaskFromDependencyJSON(subitem));
  }
  return subGraph;
};

/**
 * Creates a task instance from a task graph item JSON representation
 * @param item The JSON representation of the task
 * @returns A new task instance
 * @throws Error if required fields are missing or invalid
 */
export const createTaskFromGraphJSON = (item: TaskGraphItemJson) => {
  const task = createSingleTaskFromJSON(item);
  if (item.subgraph) {
    if (!(task instanceof GraphAsTask)) {
      throw new TaskConfigurationError("Subgraph is only supported for GraphAsTask");
    }
    task.subGraph = createGraphFromGraphJSON(item.subgraph);
  }
  return task;
};

/**
 * Creates a TaskGraph instance from its JSON representation
 * @param graphJsonObj The JSON representation of the task graph
 * @returns A new TaskGraph instance with all tasks and data flows
 */
export const createGraphFromGraphJSON = (graphJsonObj: TaskGraphJson) => {
  const subGraph = new TaskGraph();
  for (const subitem of graphJsonObj.tasks) {
    subGraph.addTask(createTaskFromGraphJSON(subitem));
  }
  for (const subitem of graphJsonObj.dataflows) {
    subGraph.addDataflow(
      new Dataflow(
        subitem.sourceTaskId,
        subitem.sourceTaskPortId,
        subitem.targetTaskId,
        subitem.targetTaskPortId
      )
    );
  }
  return subGraph;
};
