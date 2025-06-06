//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TSchema, Type } from "@sinclair/typebox";
import { TaskOutputRepository } from "../storage/TaskOutputRepository";
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

export interface TaskIO {
  [key: string]: unknown;
}

/** Type for task input data */
export type TaskInput = TaskIO;

/** Type for task output data */
export type TaskOutput = TaskIO;

export type CompoundTaskOutput =
  | {
      outputs: TaskOutput[];
    }
  | {
      [key: string]: unknown | unknown[] | undefined;
    };

/** Type for task provenance metadata */
export type Provenance = TaskIO;

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
  outputCache?: TaskOutputRepository | boolean;

  /** Optional cacheable flag to use for this task, overriding the default static property */
  cacheable?: boolean;
}

/** Type for task ID */
export type TaskIdType = Task<TaskInput, TaskOutput, TaskConfig>["config"]["id"];
