//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DirectedAcyclicGraph } from "@sroussey/typescript-graph";
import { Provenance, TaskIdType } from "../task/TaskTypes";
import { JsonTaskItem, TaskGraphJson } from "../task/TaskJSON";
import { Dataflow, DataflowIdType } from "./Dataflow";
import { ITask } from "../task/ITask";
import { TaskGraphRunner } from "./TaskGraphRunner";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";

/**
 * Configuration for running a task graph
 */
export interface TaskGraphRunConfig {
  /** Optional output cache to use for this task graph */
  outputCache?: TaskOutputRepository;
  /** Optional signal to abort the task graph */
  parentSignal?: AbortSignal;
  /** Optional provenance to use for this task graph */
  parentProvenance?: Provenance;
}

/**
 * Represents a task graph, a directed acyclic graph of tasks and data flows
 */
export class TaskGraph extends DirectedAcyclicGraph<ITask, Dataflow, TaskIdType, DataflowIdType> {
  constructor(public outputCache?: TaskOutputRepository) {
    super(
      (task: ITask) => task.config.id,
      (dataflow: Dataflow) => dataflow.id
    );
  }

  private _runner: TaskGraphRunner | undefined;
  public get runner(): TaskGraphRunner {
    if (!this._runner) {
      this._runner = new TaskGraphRunner(this, this.outputCache);
    }
    return this._runner;
  }

  public run(config?: TaskGraphRunConfig) {
    if (config?.outputCache) {
      this.outputCache = config.outputCache;
    }
    return this.runner.runGraph({
      outputCache: config?.outputCache || this.outputCache,
      parentProvenance: config?.parentProvenance || {},
      parentSignal: config?.parentSignal || undefined,
    });
  }

  public runReactive() {
    return this.runner.runGraphReactive();
  }

  /**
   * Retrieves a task from the task graph by its id
   * @param id The id of the task to retrieve
   * @returns The task with the given id, or undefined if not found
   */
  public getTask(id: TaskIdType): ITask | undefined {
    return super.getNode(id);
  }

  /**
   * Adds a task to the task graph
   * @param task The task to add
   * @returns The current task graph
   */
  public addTask(task: ITask) {
    return super.addNode(task);
  }

  /**
   * Adds multiple tasks to the task graph
   * @param tasks The tasks to add
   * @returns The current task graph
   */
  public addTasks(tasks: ITask[]) {
    return super.addNodes(tasks);
  }

  /**
   * Adds a data flow to the task graph
   * @param dataflow The data flow to add
   * @returns The current task graph
   */
  public addDataflow(dataflow: Dataflow) {
    return super.addEdge(dataflow.sourceTaskId, dataflow.targetTaskId, dataflow);
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
    return super.addEdges(addedEdges);
  }

  /**
   * Retrieves a data flow from the task graph by its id
   * @param id The id of the data flow to retrieve
   * @returns The data flow with the given id, or undefined if not found
   */
  public getDataflow(id: DataflowIdType): Dataflow | undefined {
    for (const i in this.adjacency) {
      for (const j in this.adjacency[i]) {
        const maybeEdges = this.adjacency[i][j];
        if (maybeEdges !== null) {
          for (const edge of maybeEdges) {
            if (this.edgeIdentity(edge, "", "") == id) {
              return edge;
            }
          }
        }
      }
    }
  }
  public getDataflows(): Dataflow[] {
    return this.getEdges().map((edge) => edge[2]);
  }

  /**
   * Retrieves the data flows that are sources of a given task
   * @param taskId The id of the task to retrieve sources for
   * @returns An array of data flows that are sources of the given task
   */
  public getSourceDataflows(taskId: unknown): Dataflow[] {
    return this.inEdges(taskId).map(([, , dataflow]) => dataflow);
  }

  /**
   * Retrieves the data flows that are targets of a given task
   * @param taskId The id of the task to retrieve targets for
   * @returns An array of data flows that are targets of the given task
   */
  public getTargetDataflows(taskId: unknown): Dataflow[] {
    return this.outEdges(taskId).map(([, , dataflow]) => dataflow);
  }

  /**
   * Retrieves the tasks that are sources of a given task
   * @param taskId The id of the task to retrieve sources for
   * @returns An array of tasks that are sources of the given task
   */
  public getSourceTasks(taskId: unknown): ITask[] {
    return this.getSourceDataflows(taskId).map((dataflow) => this.getNode(dataflow.sourceTaskId)!);
  }

  /**
   * Retrieves the tasks that are targets of a given task
   * @param taskId The id of the task to retrieve targets for
   * @returns An array of tasks that are targets of the given task
   */
  public getTargetTasks(taskId: unknown): ITask[] {
    return this.getTargetDataflows(taskId).map((dataflow) => this.getNode(dataflow.targetTaskId)!);
  }

  /**
   * Converts the task graph to a JSON format suitable for dependency tracking
   * @returns An array of JsonTaskItem objects, each representing a task and its dependencies
   */
  public toJSON(): TaskGraphJson {
    const nodes = this.getNodes().map((node) => node.toJSON());
    const edges = this.getDataflows().map((df) => df.toJSON());
    return {
      nodes,
      edges,
    };
  }

  /**
   * Converts the task graph to a JSON format suitable for dependency tracking
   * @returns An array of JsonTaskItem objects, each representing a task and its dependencies
   */
  public toDependencyJSON(): JsonTaskItem[] {
    const nodes = this.getNodes().flatMap((node) => node.toDependencyJSON());
    this.getDataflows().forEach((edge) => {
      const target = nodes.find((node) => node.id === edge.targetTaskId)!;
      if (!target.dependencies) {
        target.dependencies = {};
      }
      const targetDeps = target.dependencies[edge.targetTaskPortId];
      if (!targetDeps) {
        target.dependencies[edge.targetTaskPortId] = {
          id: edge.sourceTaskId,
          output: edge.sourceTaskPortId,
        };
      } else {
        if (Array.isArray(targetDeps)) {
          targetDeps.push({
            id: edge.sourceTaskId,
            output: edge.sourceTaskPortId,
          });
        } else {
          target.dependencies[edge.targetTaskPortId] = [
            targetDeps,
            { id: edge.sourceTaskId, output: edge.sourceTaskPortId },
          ];
        }
      }
    });
    return nodes;
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
