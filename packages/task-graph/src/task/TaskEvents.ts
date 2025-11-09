//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@podley/util";
import { TaskAbortedError, TaskError } from "./TaskError";
import { TaskStatus } from "../common";

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

  /** Fired when a task begins streaming on a specific output port */
  stream_start: (portId: string) => void;

  /** Fired when a streaming chunk is produced */
  stream_chunk: (portId: string, chunk: unknown, aggregate: unknown) => void;

  /** Fired when a task finishes streaming on a specific output port */
  stream_end: (portId: string, aggregate: unknown) => void;

  /** Fired when a task is aborted */
  abort: (error: TaskAbortedError) => void;

  /** Fired when a task encounters an error */
  error: (error: TaskError) => void;

  /** Fired when a task is skipped */
  skipped: () => void;

  /** Fired when a task reports progress */
  progress: (progress: number, message?: string, ...args: any[]) => void;

  /** Fired when a regenerative task regenerates its graph */
  regenerate: () => void;

  /** Fired when a task is reset to original state */
  reset: () => void;

  /** Fired when a task status is updated */
  status: (status: TaskStatus) => void;
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
