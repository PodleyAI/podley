//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@ellmers/util";
import { TaskAbortedError, TaskError } from "./TaskError";

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
  progress: (progress: number, message?: string, ...args: any[]) => void;

  /** Fired when a regenerative task regenerates its graph */
  regenerate: () => void;

  /** Fired when a task is reset to original state */
  reset: () => void;
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
