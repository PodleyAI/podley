//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { DirectedAcyclicGraph } from "@ellmers/util";
import { TaskOutputRepository } from "../storage/TaskOutputRepository";
import { ITask } from "../task/ITask";
import { JsonTaskItem, TaskGraphJson } from "../task/TaskJSON";
import { Provenance, TaskIdType, TaskOutput } from "../task/TaskTypes";
import { Dataflow, DataflowIdType } from "./Dataflow";
import { ITaskGraph } from "./ITaskGraph";
import {
  EventTaskGraphToDagMapping,
  TaskGraphEventListener,
  TaskGraphEventParameters,
  TaskGraphEvents,
} from "./TaskGraphEvents";
import { CompoundMergeStrategy, NamedGraphResult, TaskGraphRunner } from "./TaskGraphRunner";

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

class TaskGraphDAG extends DirectedAcyclicGraph<
  ITask<any, any, any>,
  Dataflow,
  TaskIdType,
  DataflowIdType
> {
  constructor() {
    super(
      (task: ITask<any, any, any>) => task.config.id,
      (dataflow: Dataflow) => dataflow.id
    );
  }
}

interface TaskGraphConstructorConfig {
  outputCache?: TaskOutputRepository;
  dag?: TaskGraphDAG;
}

/**
 * Represents a task graph, a directed acyclic graph of tasks and data flows
 */
export class TaskGraph implements ITaskGraph {
  /** Optional output cache to use for this task graph */
  public outputCache?: TaskOutputRepository;

  /**
   * Constructor for TaskGraph
   * @param config Configuration for the task graph
   */
  constructor({ outputCache, dag }: TaskGraphConstructorConfig = {}) {
    this.outputCache = outputCache;
    this._dag = dag || new TaskGraphDAG();
  }

  private _dag: TaskGraphDAG;

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
   * @throws TaskError if any tasks have failed
   */
  public run<ExecuteOutput extends TaskOutput>(
    config?: TaskGraphRunConfig
  ): Promise<NamedGraphResult<ExecuteOutput>> {
    return this.runner.runGraph<ExecuteOutput>({
      outputCache: config?.outputCache || this.outputCache,
      parentProvenance: config?.parentProvenance || {},
      parentSignal: config?.parentSignal || undefined,
    });
  }

  /**
   * Runs the task graph reactively
   * @returns A promise that resolves when all tasks are complete
   * @throws TaskError if any tasks have failed
   */
  public runReactive<Output extends TaskOutput>(): Promise<NamedGraphResult<Output>> {
    return this.runner.runGraphReactive<Output>();
  }

  /**
   * Merges the execute output to the run output
   * @param results The execute output
   * @param compoundMerge The compound merge strategy to use
   * @returns The run output
   */
  public mergeExecuteOutputsToRunOutput<
    ExecuteOutput extends TaskOutput,
    Output extends TaskOutput = ExecuteOutput,
  >(results: NamedGraphResult<ExecuteOutput>, compoundMerge: CompoundMergeStrategy): Output {
    return this.runner.mergeExecuteOutputsToRunOutput(results, compoundMerge);
  }

  /**
   * Aborts the task graph
   */
  public abort() {
    this.runner.abort();
  }

  /**
   * Skips the task graph
   */
  public async skip() {
    await this.runner.skip();
  }

  /**
   * Retrieves a task from the task graph by its id
   * @param id The id of the task to retrieve
   * @returns The task with the given id, or undefined if not found
   */
  public getTask(id: TaskIdType): ITask<any, any, any> | undefined {
    return this._dag.getNode(id);
  }

  /**
   * Retrieves all tasks in the task graph
   * @returns An array of tasks in the task graph
   */
  public getTasks(): ITask<any, any, any>[] {
    return this._dag.getNodes();
  }

  /**
   * Retrieves all tasks in the task graph topologically sorted
   * @returns An array of tasks in the task graph topologically sorted
   */
  public topologicallySortedNodes(): ITask<any, any, any>[] {
    return this._dag.topologicallySortedNodes();
  }

  /**
   * Adds a task to the task graph
   * @param task The task to add
   * @returns The current task graph
   */
  public addTask(task: ITask<any, any, any>) {
    return this._dag.addNode(task);
  }

  /**
   * Adds multiple tasks to the task graph
   * @param tasks The tasks to add
   * @returns The current task graph
   */
  public addTasks(tasks: ITask<any, any, any>[]) {
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
  public getSourceTasks(taskId: unknown): ITask<any, any, any>[] {
    return this.getSourceDataflows(taskId).map((dataflow) => this.getTask(dataflow.sourceTaskId)!);
  }

  /**
   * Retrieves the tasks that are targets of a given task
   * @param taskId The id of the task to retrieve targets for
   * @returns An array of tasks that are targets of the given task
   */
  public getTargetTasks(taskId: unknown): ITask<any, any, any>[] {
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

  // ========================================================================
  // Event handling
  // ========================================================================

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
function serialGraphEdges(
  tasks: ITask<any, any, any>[],
  inputHandle: string,
  outputHandle: string
): Dataflow[] {
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
export function serialGraph(
  tasks: ITask<any, any, any>[],
  inputHandle: string,
  outputHandle: string
): TaskGraph {
  const graph = new TaskGraph();
  graph.addTasks(tasks);
  graph.addDataflows(serialGraphEdges(tasks, inputHandle, outputHandle));
  return graph;
}
