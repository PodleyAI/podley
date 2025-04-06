//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskOutputRepository } from "../storage/TaskOutputRepository";
import { CompoundMergeStrategy } from "../task-graph/TaskGraphRunner";
import type { Task } from "./Task";

/**
 * Enum representing the possible states of a task
 *
 *  PENDING -> PROCESSING -> COMPLETED
 *  PENDING -> PROCESSING -> ABORTING -> FAILED
 *  PENDING -> PROCESSING -> FAILED
 *  PENDING -> SKIPPED
 *
 */
export enum TaskStatus {
  /** Task is created but not yet started */
  PENDING = "PENDING",
  /** Task is skipped due to conditional logic */
  SKIPPED = "SKIPPED",
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
// Core Task Data Types
// ========================================================================

/** Type for task input data */
export type TaskInput = Record<string, any>;

/** Type for task output data */
export type TaskOutput = Record<string, any>;

export type CompoundTaskOutput =
  | {
      outputs: TaskOutput[];
    }
  | {
      [key: string]: any | any[] | undefined;
    };

/** Type for task provenance metadata */
export type Provenance = Record<string, any>;

/** Type for task type names */
export type TaskTypeName = string;

/** Type for task configuration */
export type TaskConfig = Partial<IConfig>;

// ========================================================================
// Task Configuration Types
// ========================================================================

export interface IConfig {
  /** Unique identifier for the task */
  id: unknown;

  /** Optional display name for the task */
  name?: string;

  /** Optional metadata about task origin */
  provenance?: Provenance;

  /** Optional ID of the runner to use for this task */
  runnerId?: string;

  /** Optional output cache to use for this task */
  outputCache?: TaskOutputRepository;

  /** Optional cacheable flag to use for this task, overriding the default static property */
  cacheable?: boolean;
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
  readonly isArray?: boolean | "replicate";

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
  readonly isArray?: boolean | "replicate";
};

/** Type for task ID */
export type TaskIdType = Task<TaskInput, TaskOutput, TaskConfig>["config"]["id"];
