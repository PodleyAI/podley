//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@ellmers/util";
import { GraphEvents } from "@ellmers/util";
import { ITask } from "../task/ITask";
import { Dataflow } from "./Dataflow";

/**
 * Events that can be emitted by the TaskGraph
 */
export type TaskGraphEvents = keyof TaskGraphEventListeners;

export type TaskGraphEventListeners = {
  task_added: (task: ITask) => void;
  task_removed: (task: ITask) => void;
  task_replaced: (task: ITask) => void;
  dataflow_added: (dataflow: Dataflow) => void;
  dataflow_removed: (dataflow: Dataflow) => void;
  dataflow_replaced: (dataflow: Dataflow) => void;
};

export type TaskGraphEventListener<Event extends TaskGraphEvents> = TaskGraphEventListeners[Event];

export type TaskGraphEventParameters<Event extends TaskGraphEvents> = EventParameters<
  TaskGraphEventListeners,
  Event
>;

export const EventDagToTaskGraphMapping: Record<GraphEvents<ITask, Dataflow>, TaskGraphEvents> = {
  "node-added": "task_added",
  "node-removed": "task_removed",
  "node-replaced": "task_replaced",
  "edge-added": "dataflow_added",
  "edge-removed": "dataflow_removed",
  "edge-replaced": "dataflow_replaced",
} as const;

export const EventTaskGraphToDagMapping: Record<TaskGraphEvents, GraphEvents<ITask, Dataflow>> = {
  task_added: "node-added",
  task_removed: "node-removed",
  task_replaced: "node-replaced",
  dataflow_added: "edge-added",
  dataflow_removed: "edge-removed",
  dataflow_replaced: "edge-replaced",
} as const;
