//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@ellmers/util";
import type { TaskGraph } from "../task-graph/TaskGraph";

import type { CompoundTask } from "./CompoundTask";
import type { SingleTask } from "./SingleTask";
import type { TaskBase } from "./TaskBase";
import { TaskAbortedError } from "./TaskError";
import { TaskError } from "./TaskError";

export enum TaskStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ABORTING = "ABORTING",
  FAILED = "FAILED",
}

/**
 * Represents a single task item in the JSON configuration.
 * This structure defines how tasks should be configured in JSON format.
 */
export type JsonTaskItem = {
  id: unknown; // Unique identifier for the task
  type: string; // Type of task to create
  name?: string; // Optional display name for the task
  input?: TaskInput; // Input configuration for the task
  dependencies?: {
    // Defines data flow between tasks
    [x: string]: // Input parameter name
    | {
          id: unknown; // ID of the source task
          output: string; // Output parameter name from source task
        }
      | {
          id: unknown;
          output: string;
        }[];
  };
  provenance?: Provenance; // Optional metadata about task origin
  subtasks?: JsonTaskItem[]; // Nested tasks for compound operations
};

/**
 * TaskEvents
 *
 * There is no job queue at the moement.
 */

export type TaskEventListeners = {
  start: () => void;
  complete: () => void;
  abort: (error: TaskAbortedError) => void;
  error: (error: TaskError) => void;
  progress: (progress: number) => void;
  regenerate: () => void;
};

export type TaskEvents = keyof TaskEventListeners;

export type TaskEventListener<Event extends TaskEvents> = TaskEventListeners[Event];

export type TaskEventParameters<Event extends TaskEvents> = EventParameters<
  TaskEventListeners,
  Event
>;

export type TaskInput = Record<string, any>;
export type TaskOutput = Record<string, any>;
export type Provenance = Record<string, any>;

export interface ITaskSimple {
  readonly isCompound: false;
}
export interface ITaskCompound {
  readonly isCompound: true;
  subGraph: TaskGraph;
}

export type ITask = ITaskSimple | ITaskCompound;

export type TaskTypeName = string;

export type TaskConfig = Partial<IConfig>;

// ===============================================================================

export interface IConfig {
  id: unknown;
  name?: string;
  provenance?: Provenance;
  runnerId?: string;
}

export type TaskInputDefinition = {
  readonly id: string;
  readonly name: string;
  readonly valueType: string;
  readonly isArray?: boolean;
  readonly defaultValue?: any;
  readonly optional?: boolean;
};

export type TaskOutputDefinition = {
  readonly id: string;
  readonly name: string;
  readonly valueType: string;
  readonly isArray?: boolean;
};

export type TaskIdType = TaskBase<TaskInput, TaskOutput, TaskConfig>["config"]["id"];

// ===============================================================================

export type Task = SingleTask | CompoundTask;
