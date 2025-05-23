//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@ellmers/util";
import { ITask } from "../task/ITask";
import { Dataflow } from "./Dataflow";

/**
 * Events that can be emitted by the TaskGraph
 */

export type TaskGraphStatusListeners = {
  graph_progress: (progress: number, message?: string, ...args: any[]) => void;
  start: () => void;
  complete: () => void;
  error: (error: Error) => void;
  abort: () => void;
  skip: () => void;
};
export type TaskGraphStatusEvents = keyof TaskGraphStatusListeners;
export type TaskGraphStatusListener<Event extends TaskGraphStatusEvents> =
  TaskGraphStatusListeners[Event];
export type TaskGraphEventStatusParameters<Event extends TaskGraphStatusEvents> = EventParameters<
  TaskGraphStatusListeners,
  Event
>;

export type GraphEventDagListeners = {
  task_added: (task: ITask) => void;
  task_removed: (task: ITask) => void;
  task_replaced: (task: ITask) => void;
  dataflow_added: (dataflow: Dataflow) => void;
  dataflow_removed: (dataflow: Dataflow) => void;
  dataflow_replaced: (dataflow: Dataflow) => void;
};
export type GraphEventDagEvents = keyof GraphEventDagListeners;
export type GraphEventDagListener<Event extends GraphEventDagEvents> =
  GraphEventDagListeners[Event];
export type GraphEventDagParameters<Event extends GraphEventDagEvents> = EventParameters<
  GraphEventDagListeners,
  Event
>;

export type TaskGraphListeners = TaskGraphStatusListeners & GraphEventDagListeners;
export type TaskGraphEvents = keyof TaskGraphListeners;
export type TaskGraphEventListener<Event extends TaskGraphEvents> = TaskGraphListeners[Event];
export type TaskGraphEventParameters<Event extends TaskGraphEvents> = EventParameters<
  TaskGraphListeners,
  Event
>;

export const EventDagToTaskGraphMapping = {
  "node-added": "task_added",
  "node-removed": "task_removed",
  "node-replaced": "task_replaced",
  "edge-added": "dataflow_added",
  "edge-removed": "dataflow_removed",
  "edge-replaced": "dataflow_replaced",
} as const;

export const EventTaskGraphToDagMapping = {
  task_added: "node-added",
  task_removed: "node-removed",
  task_replaced: "node-replaced",
  dataflow_added: "edge-added",
  dataflow_removed: "edge-removed",
  dataflow_replaced: "edge-replaced",
} as const;
