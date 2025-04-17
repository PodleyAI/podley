//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters, GraphEvents } from "@ellmers/util";
import { ITask } from "../task/ITask";
import { Dataflow } from "./Dataflow";

/**
 * Events that can be emitted by the TaskGraph
 */
type BaseGraphEvents = keyof GraphEventListeners;

type TaskGraphStatusListeners = {
  graph_progress: (progress: number, message?: string, ...args: any[]) => void;
  task_status: (task: ITask) => void;
  dataflow_status: (dataflow: Dataflow) => void;
};
type TaskGraphStatusEvents = keyof TaskGraphStatusListeners;

type GraphEventListeners = {
  task_added: (task: ITask) => void;
  task_removed: (task: ITask) => void;
  task_replaced: (task: ITask) => void;
  dataflow_added: (dataflow: Dataflow) => void;
  dataflow_removed: (dataflow: Dataflow) => void;
  dataflow_replaced: (dataflow: Dataflow) => void;
};

export type TaskGraphEventListeners = TaskGraphStatusListeners & GraphEventListeners;
export type TaskGraphEvents = keyof TaskGraphEventListeners;

export type TaskGraphEventListener<Event extends TaskGraphEvents> = TaskGraphEventListeners[Event];

export type TaskGraphEventParameters<Event extends TaskGraphEvents> = EventParameters<
  TaskGraphEventListeners,
  Event
>;

export const EventDagToTaskGraphMapping: Record<GraphEvents<ITask, Dataflow>, BaseGraphEvents> = {
  "node-added": "task_added",
  "node-removed": "task_removed",
  "node-replaced": "task_replaced",
  "edge-added": "dataflow_added",
  "edge-removed": "dataflow_removed",
  "edge-replaced": "dataflow_replaced",
} as const;

export const EventTaskGraphToDagMapping: Record<BaseGraphEvents, GraphEvents<ITask, Dataflow>> = {
  task_added: "node-added",
  task_removed: "node-removed",
  task_replaced: "node-replaced",
  dataflow_added: "edge-added",
  dataflow_removed: "edge-removed",
  dataflow_replaced: "edge-replaced",
} as const;
