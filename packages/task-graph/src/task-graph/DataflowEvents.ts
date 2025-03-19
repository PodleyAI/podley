//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@ellmers/util";
import { TaskError } from "../task/TaskError";

/**
 * Event listeners for dataflow events
 */

export type DataflowEventListeners = {
  /** Fired when a source task starts execution */
  start: () => void;

  /** Fired when a source task completes successfully */
  complete: () => void;

  /** Fired when a source task is aborted */
  abort: () => void;

  /** Fired when a source task encounters an error */
  error: (error: TaskError) => void;

  /** Fired when a dataflow is reset to original state */
  reset: () => void;
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
