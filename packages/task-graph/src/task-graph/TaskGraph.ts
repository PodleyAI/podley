//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DirectedAcyclicGraph, GraphEvents } from "@ellmers/util";
import { Provenance, TaskIdType } from "../task/TaskTypes";
import { JsonTaskItem, TaskGraphJson } from "../task/TaskJSON";
import { Dataflow, DataflowIdType } from "./Dataflow";
import { ITask } from "../task/ITask";
import { TaskGraphRunner } from "./TaskGraphRunner";
import { TaskOutputRepository } from "../storage/TaskOutputRepository";
import { EventParameters } from "@ellmers/util";

/**
 * Configuration for running a task graph
 */
export interface TaskGraphRunConfig {
  /** Optional output cache to use for this task graph */
  outputCache?: TaskOutputRepository | boolean;
  /** Optional signal to abort the task graph */
  parentSignal?: AbortSignal;
  /** Optional provenance to use for this task graph */
  parentProvenance?: Provenance;
}

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

const EventDagToTaskGraphMapping: Record<GraphEvents<ITask, Dataflow>, TaskGraphEvents> = {
  "node-added": "task_added",
  "node-removed": "task_removed",
  "node-replaced": "task_replaced",
  "edge-added": "dataflow_added",
  "edge-removed": "dataflow_removed",
  "edge-replaced": "dataflow_replaced",
} as const;

const EventTaskGraphToDagMapping: Record<TaskGraphEvents, GraphEvents<ITask, Dataflow>> = {
  task_added: "node-added",
  task_removed: "node-removed",
  task_replaced: "node-replaced",
  dataflow_added: "edge-added",
  dataflow_removed: "edge-removed",
  dataflow_replaced: "edge-replaced",
} as const;

/**
 * Represents a task graph, a directed acyclic graph of tasks and data flows
 */
export class TaskGraph {
  /** Optional output cache to use for this task graph */
  public outputCache?: TaskOutputRepository;
  constructor({
    outputCache,
    dag,
  }: {
    outputCache?: TaskOutputRepository;
    dag?: DirectedAcyclicGraph<ITask, Dataflow, TaskIdType, DataflowIdType>;
  } = {}) {
    this.outputCache = outputCache;
    this._dag =
      dag ||
      new DirectedAcyclicGraph<ITask, Dataflow, TaskIdType, DataflowIdType>(
        (task: ITask) => task.config.id,
        (dataflow: Dataflow) => dataflow.id
      );
  }

  private _dag: DirectedAcyclicGraph<ITask, Dataflow, TaskIdType, DataflowIdType>;

  private _runner: TaskGraphRunner | undefined;
  public get runner(): TaskGraphRunner {
    if (!this._runner) {
      this._runner = new TaskGraphRunner(this, this.outputCache);
    }
    return this._runner;
  }
  // ========================================================================
  // Public methods
  // ========================================================================

  /**
   * Runs the task graph
   * @param config Configuration for the graph run
   * @returns A promise that resolves when all tasks are complete
   * @throws TaskErrorGroup if any tasks have failed
   */
  public run(config?: TaskGraphRunConfig) {
    return this.runner.runGraph({
      outputCache: config?.outputCache || this.outputCache,
      parentProvenance: config?.parentProvenance || {},
      parentSignal: config?.parentSignal || undefined,
    });
  }

  /**
   * Runs the task graph reactively
   * @returns A promise that resolves when all tasks are complete
   * @throws TaskErrorGroup if any tasks have failed
   */
  public runReactive() {
    return this.runner.runGraphReactive();
  }

  /**
   * Aborts the task graph
   */
  public abort() {
    this.runner.abort();
  }

  /**
   * Retrieves a task from the task graph by its id
   * @param id The id of the task to retrieve
   * @returns The task with the given id, or undefined if not found
   */
  public getTask(id: TaskIdType): ITask | undefined {
    return this._dag.getNode(id);
  }

  /**
   * Retrieves all tasks in the task graph
   * @returns An array of tasks in the task graph
   */
  public getTasks(): ITask[] {
    return this._dag.getNodes();
  }

  /**
   * Retrieves all tasks in the task graph topologically sorted
   * @returns An array of tasks in the task graph topologically sorted
   */
  public topologicallySortedNodes(): ITask[] {
    return this._dag.topologicallySortedNodes();
  }

  /**
   * Adds a task to the task graph
   * @param task The task to add
   * @returns The current task graph
   */
  public addTask(task: ITask) {
    return this._dag.addNode(task);
  }

  /**
   * Adds multiple tasks to the task graph
   * @param tasks The tasks to add
   * @returns The current task graph
   */
  public addTasks(tasks: ITask[]) {
    return this._dag.addNodes(tasks);
  }

  /**
   * Adds a data flow to the task graph
   * @param dataflow The data flow to add
   * @returns The current task graph
   */
  public addDataflow(dataflow: Dataflow) {
    return this._dag.addEdge(dataflow.sourceTaskId, dataflow.targetTaskId, dataflow);
  }

  /**
   * Adds multiple data flows to the task graph
   * @param dataflows The data flows to add
   * @returns The current task graph
   */
  public addDataflows(dataflows: Dataflow[]) {
    const addedEdges = dataflows.map<[s: unknown, t: unknown, e: Dataflow]>((edge) => {
      return [edge.sourceTaskId, edge.targetTaskId, edge];
    });
    return this._dag.addEdges(addedEdges);
  }

  /**
   * Retrieves a data flow from the task graph by its id
   * @param id The id of the data flow to retrieve
   * @returns The data flow with the given id, or undefined if not found
   */
  public getDataflow(id: DataflowIdType): Dataflow | undefined {
    // @ts-ignore
    for (const i in this._dag.adjacency) {
      // @ts-ignore
      for (const j in this._dag.adjacency[i]) {
        // @ts-ignore
        const maybeEdges = this._dag.adjacency[i][j];
        if (maybeEdges !== null) {
          for (const edge of maybeEdges) {
            // @ts-ignore
            if (this._dag.edgeIdentity(edge, "", "") == id) {
              return edge;
            }
          }
        }
      }
    }
  }

  /**
   * Retrieves all data flows in the task graph
   * @returns An array of data flows in the task graph
   */
  public getDataflows(): Dataflow[] {
    return this._dag.getEdges().map((edge) => edge[2]);
  }

  /**
   * Retrieves the data flows that are sources of a given task
   * @param taskId The id of the task to retrieve sources for
   * @returns An array of data flows that are sources of the given task
   */
  public getSourceDataflows(taskId: unknown): Dataflow[] {
    return this._dag.inEdges(taskId).map(([, , dataflow]) => dataflow);
  }

  /**
   * Retrieves the data flows that are targets of a given task
   * @param taskId The id of the task to retrieve targets for
   * @returns An array of data flows that are targets of the given task
   */
  public getTargetDataflows(taskId: unknown): Dataflow[] {
    return this._dag.outEdges(taskId).map(([, , dataflow]) => dataflow);
  }

  /**
   * Retrieves the tasks that are sources of a given task
   * @param taskId The id of the task to retrieve sources for
   * @returns An array of tasks that are sources of the given task
   */
  public getSourceTasks(taskId: unknown): ITask[] {
    return this.getSourceDataflows(taskId).map((dataflow) => this.getTask(dataflow.sourceTaskId)!);
  }

  /**
   * Retrieves the tasks that are targets of a given task
   * @param taskId The id of the task to retrieve targets for
   * @returns An array of tasks that are targets of the given task
   */
  public getTargetTasks(taskId: unknown): ITask[] {
    return this.getTargetDataflows(taskId).map((dataflow) => this.getTask(dataflow.targetTaskId)!);
  }

  /**
   * Removes a task from the task graph
   * @param taskId The id of the task to remove
   * @returns The current task graph
   */
  public removeTask(taskId: unknown) {
    return this._dag.removeNode(taskId);
  }

  /**
   * Converts the task graph to a JSON format suitable for dependency tracking
   * @returns An array of JsonTaskItem objects, each representing a task and its dependencies
   */
  public toJSON(): TaskGraphJson {
    const tasks = this.getTasks().map((node) => node.toJSON());
    const dataflows = this.getDataflows().map((df) => df.toJSON());
    return {
      tasks,
      dataflows,
    };
  }

  /**
   * Converts the task graph to a JSON format suitable for dependency tracking
   * @returns An array of JsonTaskItem objects, each representing a task and its dependencies
   */
  public toDependencyJSON(): JsonTaskItem[] {
    const tasks = this.getTasks().flatMap((node) => node.toDependencyJSON());
    this.getDataflows().forEach((df) => {
      const target = tasks.find((node) => node.id === df.targetTaskId)!;
      if (!target.dependencies) {
        target.dependencies = {};
      }
      const targetDeps = target.dependencies[df.targetTaskPortId];
      if (!targetDeps) {
        target.dependencies[df.targetTaskPortId] = {
          id: df.sourceTaskId,
          output: df.sourceTaskPortId,
        };
      } else {
        if (Array.isArray(targetDeps)) {
          targetDeps.push({
            id: df.sourceTaskId,
            output: df.sourceTaskPortId,
          });
        } else {
          target.dependencies[df.targetTaskPortId] = [
            targetDeps,
            { id: df.sourceTaskId, output: df.sourceTaskPortId },
          ];
        }
      }
    });
    return tasks;
  }

  /**
   * Registers an event listener for the specified event
   * @param name - The event name to listen for
   * @param fn - The callback function to execute when the event occurs
   */
  on<Event extends TaskGraphEvents>(name: Event, fn: TaskGraphEventListener<Event>) {
    this._dag.on(EventTaskGraphToDagMapping[name], fn);
  }

  /**
   * Removes an event listener for the specified event
   * @param name - The event name to listen for
   * @param fn - The callback function to execute when the event occurs
   */
  off<Event extends TaskGraphEvents>(name: Event, fn: TaskGraphEventListener<Event>) {
    this._dag.off(EventTaskGraphToDagMapping[name], fn);
  }

  /**
   * Emits an event for the specified event
   * @param name - The event name to emit
   * @param args - The arguments to pass to the event listener
   */
  emit<Event extends TaskGraphEvents>(name: Event, ...args: TaskGraphEventParameters<Event>) {
    this._dag.emit(EventTaskGraphToDagMapping[name], ...args);
  }
}

/**
 * Super simple helper if you know the input and output handles, and there is only one each
 *
 * @param tasks
 * @param inputHandle
 * @param outputHandle
 * @returns
 */
function serialGraphEdges(tasks: ITask[], inputHandle: string, outputHandle: string): Dataflow[] {
  const edges: Dataflow[] = [];
  for (let i = 0; i < tasks.length - 1; i++) {
    edges.push(new Dataflow(tasks[i].config.id, inputHandle, tasks[i + 1].config.id, outputHandle));
  }
  return edges;
}

/**
 * Super simple helper if you know the input and output handles, and there is only one each
 *
 * @param tasks
 * @param inputHandle
 * @param outputHandle
 * @returns
 */
export function serialGraph(tasks: ITask[], inputHandle: string, outputHandle: string): TaskGraph {
  const graph = new TaskGraph();
  graph.addTasks(tasks);
  graph.addDataflows(serialGraphEdges(tasks, inputHandle, outputHandle));
  return graph;
}
