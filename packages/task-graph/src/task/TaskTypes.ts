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

/**
 * Enum representing the possible states of a task
 */
export enum TaskStatus {
  /** Task is created but not yet started */
  PENDING = "PENDING",

  /** Task is currently running */
  PROCESSING = "PROCESSING",

  /** Task has completed successfully */
  COMPLETED = "COMPLETED",

  /** Task is in the process of being aborted */
  ABORTING = "ABORTING",

  /** Task has failed */
  FAILED = "FAILED",
}

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
};

// ========================================================================
// Event Handling Types
// ========================================================================

/**
 * Event listeners for task lifecycle events
 */
export type TaskEventListeners = {
  /** Fired when a task starts execution */
  start: () => void;

  /** Fired when a task completes successfully */
  complete: () => void;

  /** Fired when a task is aborted */
  abort: (error: TaskAbortedError) => void;

  /** Fired when a task encounters an error */
  error: (error: TaskError) => void;

  /** Fired when a task reports progress */
  progress: (progress: number) => void;

  /** Fired when a regenerative task regenerates its graph */
  regenerate: () => void;
};

/** Union type of all possible task event names */
export type TaskEvents = keyof TaskEventListeners;

/** Type for task event listener functions */
export type TaskEventListener<Event extends TaskEvents> = TaskEventListeners[Event];

/** Type for task event parameters */
export type TaskEventParameters<Event extends TaskEvents> = EventParameters<
  TaskEventListeners,
  Event
>;

// ========================================================================
// Core Task Data Types
// ========================================================================

/** Type for task input data */
export type TaskInput = Record<string, any>;

/** Type for task output data */
export type TaskOutput = Record<string, any>;

/** Type for task provenance metadata */
export type Provenance = Record<string, any>;

/** Interface for simple (non-compound) tasks */
export interface ITaskSimple {
  readonly isCompound: false;
}

/** Interface for compound tasks */
export interface ITaskCompound {
  readonly isCompound: true;
  subGraph: TaskGraph;
}

/** Type for task type names */
export type TaskTypeName = string;

/** Type for task configuration */
export type TaskConfig = Partial<IConfig>;

// ========================================================================
// Task Configuration Types
// ========================================================================

/**
 * Interface for task configuration
 */
export interface IConfig {
  /** Unique identifier for the task */
  id: unknown;

  /** Optional display name for the task */
  name?: string;

  /** Optional metadata about task origin */
  provenance?: Provenance;

  /** Optional ID of the runner to use for this task */
  runnerId?: string;
}

/**
 * Definition of a task input parameter
 */
export type TaskInputDefinition = {
  /** Identifier for the input */
  readonly id: string;

  /** Display name for the input */
  readonly name: string;

  /** Type of value expected for this input */
  readonly valueType: string;

  /** Whether this input accepts an array of values */
  readonly isArray?: boolean;

  /** Default value for this input */
  readonly defaultValue?: any;

  /** Whether this input is optional */
  readonly optional?: boolean;
};

/**
 * Definition of a task output parameter
 */
export type TaskOutputDefinition = {
  /** Identifier for the output */
  readonly id: string;

  /** Display name for the output */
  readonly name: string;

  /** Type of value produced for this output */
  readonly valueType: string;

  /** Whether this output produces an array of values */
  readonly isArray?: boolean;
};

/** Type for task ID */
export type TaskIdType = TaskBase<TaskInput, TaskOutput, TaskConfig>["config"]["id"];
