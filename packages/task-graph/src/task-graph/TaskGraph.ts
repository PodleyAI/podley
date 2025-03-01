//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DirectedAcyclicGraph } from "@sroussey/typescript-graph";
import { Task, TaskIdType, TaskInput, JsonTaskItem } from "../task/TaskTypes";
import { Dataflow, DataflowIdType, DataflowJson } from "./Dataflow";

/**
 * Represents a task graph item, which can be a task or a subgraph
 */
export type TaskGraphItemJson = {
  id: unknown;
  type: string;
  name?: string;
  input?: TaskInput;
  provenance?: TaskInput;
  subgraph?: TaskGraphJson;
};

export type TaskGraphJson = {
  nodes: TaskGraphItemJson[];
  edges: DataflowJson[];
};

/**
 * Represents a task graph, a directed acyclic graph of tasks and data flows
 */
export class TaskGraph extends DirectedAcyclicGraph<Task, Dataflow, TaskIdType, DataflowIdType> {
  constructor() {
    super(
      (task: Task) => task.config.id,
      (dataFlow: Dataflow) => dataFlow.id
    );
  }

  /**
   * Retrieves a task from the task graph by its id
   * @param id The id of the task to retrieve
   * @returns The task with the given id, or undefined if not found
   */
  public getTask(id: TaskIdType): Task | undefined {
    return super.getNode(id);
  }

  /**
   * Adds a task to the task graph
   * @param task The task to add
   * @returns The current task graph
   */
  public addTask(task: Task) {
    return super.addNode(task);
  }

  /**
   * Adds multiple tasks to the task graph
   * @param tasks The tasks to add
   * @returns The current task graph
   */
  public addTasks(tasks: Task[]) {
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
    return this.inEdges(taskId).map(([, , dataFlow]) => dataFlow);
  }

  /**
   * Retrieves the data flows that are targets of a given task
   * @param taskId The id of the task to retrieve targets for
   * @returns An array of data flows that are targets of the given task
   */
  public getTargetDataflows(taskId: unknown): Dataflow[] {
    return this.outEdges(taskId).map(([, , dataFlow]) => dataFlow);
  }

  /**
   * Retrieves the tasks that are sources of a given task
   * @param taskId The id of the task to retrieve sources for
   * @returns An array of tasks that are sources of the given task
   */
  public getSourceTasks(taskId: unknown): Task[] {
    return this.getSourceDataflows(taskId).map((dataFlow) => this.getNode(dataFlow.sourceTaskId)!);
  }

  /**
   * Retrieves the tasks that are targets of a given task
   * @param taskId The id of the task to retrieve targets for
   * @returns An array of tasks that are targets of the given task
   */
  public getTargetTasks(taskId: unknown): Task[] {
    return this.getTargetDataflows(taskId).map((dataFlow) => this.getNode(dataFlow.targetTaskId)!);
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
      const targetDeps = target.dependencies[edge.targetTaskInputId];
      if (!targetDeps) {
        target.dependencies[edge.targetTaskInputId] = {
          id: edge.sourceTaskId,
          output: edge.sourceTaskOutputId,
        };
      } else {
        if (Array.isArray(targetDeps)) {
          targetDeps.push({
            id: edge.sourceTaskId,
            output: edge.sourceTaskOutputId,
          });
        } else {
          target.dependencies[edge.targetTaskInputId] = [
            targetDeps,
            { id: edge.sourceTaskId, output: edge.sourceTaskOutputId },
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
 * @param tasks Task[]
 * @param inputHandle  TaskIdType
 * @param outputHandle TaskIdType
 * @returns
 */
function serialGraphEdges(tasks: Task[], inputHandle: string, outputHandle: string): Dataflow[] {
  const edges: Dataflow[] = [];
  for (let i = 0; i < tasks.length - 1; i++) {
    edges.push(new Dataflow(tasks[i].config.id, inputHandle, tasks[i + 1].config.id, outputHandle));
  }
  return edges;
}

/**
 * Super simple helper if you know the input and output handles, and there is only one each
 *
 * @param tasks Task[]
 * @param inputHandle  TaskIdType
 * @param outputHandle TaskIdType
 * @returns
 */
export function serialGraph(tasks: Task[], inputHandle: string, outputHandle: string): TaskGraph {
  const graph = new TaskGraph();
  graph.addTasks(tasks);
  graph.addDataflows(serialGraphEdges(tasks, inputHandle, outputHandle));
  return graph;
}
