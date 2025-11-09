//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@podley/util";
import { TaskError } from "../task/TaskError";
import { TaskStatus } from "../task/TaskTypes";

/**
 * Event listeners for dataflow events
 */

export type DataflowEventListeners = {
  /** Fired when a source task starts execution */
  start: () => void;

  /** Fired when a source task completes successfully */
  complete: () => void;

  /** Fired when a dataflow begins streaming */
  stream_start: () => void;

  /** Fired when a streaming chunk traverses the dataflow */
  stream_chunk: (chunk: unknown, aggregate: unknown) => void;

  /** Fired when streaming ends */
  stream_end: (aggregate: unknown) => void;

  /** Fired when a source task is skipped */
  skipped: () => void;

  /** Fired when a source task is aborted */
  abort: () => void;

  /** Fired when a source task encounters an error */
  error: (error: TaskError) => void;

  /** Fired when a dataflow is reset to original state */
  reset: () => void;

  /** Fired when a dataflow status changes */
  status: (status: TaskStatus) => void;
};
/** Union type of all possible dataflow event names */

export type DataflowEvents = keyof DataflowEventListeners;
/** Type for dataflow event listener functions */

export type DataflowEventListener<Event extends DataflowEvents> = DataflowEventListeners[Event];
/** Type for dataflow event parameters */

export type DataflowEventParameters<Event extends DataflowEvents> = EventParameters<
  DataflowEventListeners,
  Event
>;
