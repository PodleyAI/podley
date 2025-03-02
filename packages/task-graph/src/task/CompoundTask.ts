//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraph, type TaskGraphItemJson } from "../task-graph/TaskGraph";
import { TaskGraphRunner } from "../task-graph/TaskGraphRunner";
import type { ICompoundTask } from "./ITask";
import type { TaskTypeName, TaskInput, TaskOutput, JsonTaskItem, TaskConfig } from "./TaskTypes";
import { TaskBase } from "./TaskBase";

/**
 * Defines the output structure for compound tasks.
 * A compound task can either return an array of outputs or a map of named outputs.
 */
export type CompoundTaskOutput =
  | {
      outputs: TaskOutput[];
    }
  | {
      [key: string]: any | any[] | undefined;
    };

/**
 * Represents a compound task, which is a task that contains other tasks.
 * This is the base class for all compound tasks that manage subtasks.
 *
 * CompoundTask implements the ICompoundTask interface and provides functionality
 * for managing and executing a graph of subtasks.
 */
export class CompoundTask<
    Input extends TaskInput = TaskInput,
    Output extends CompoundTaskOutput = CompoundTaskOutput,
    Config extends TaskConfig = TaskConfig,
  >
  extends TaskBase<Input, Output, Config>
  implements ICompoundTask<Input, Output, Config>
{
  /**
   * The type identifier for this task class
   */
  static readonly type: TaskTypeName = "CompoundTask";

  /**
   * The category this task belongs to
   */
  static readonly category: string = "Hidden";

  /**
   * Indicates that this is a compound task (contains subtasks)
   */
  readonly isCompound = true;

  /**
   * The internal task graph containing subtasks
   */
  protected _subGraph: TaskGraph | null = null;

  /**
   * Sets the subtask graph for the compound task
   * @param subGraph The subtask graph to set
   */
  set subGraph(subGraph: TaskGraph) {
    this._subGraph = subGraph;
  }

  /**
   * Gets the subtask graph for the compound task.
   * Creates a new graph if one doesn't exist.
   * @returns The subtask graph
   */
  get subGraph(): TaskGraph {
    if (!this._subGraph) {
      this._subGraph = new TaskGraph();
    }
    return this._subGraph;
  }

  /**
   * Resets the input data for the compound task and all its subtasks
   */
  public resetInputData(): void {
    super.resetInputData();
    this.subGraph.getNodes().forEach((node) => {
      node.resetInputData();
    });
  }

  /**
   * Runs the compound task by executing all subtasks in the graph
   * @returns The combined output of all subtasks
   */
  public async runFull(): Promise<Output> {
    const runner = new TaskGraphRunner(this.subGraph, this.outputCache);
    this.runOutputData.outputs = await runner.runGraph(
      this.nodeProvenance,
      this.abortController!.signal
    );
    return this.runOutputData;
  }

  /**
   * Runs all subtasks reactively for UI updates
   * @returns The combined output of all subtasks
   */
  public async runReactive(): Promise<Output> {
    const runner = new TaskGraphRunner(this.subGraph);
    this.runOutputData.outputs = await runner.runGraphReactive();
    return this.runOutputData;
  }

  /**
   * Serializes the task and its subtasks into a format that can be stored
   * @returns The serialized task and subtasks
   */
  public toJSON(): TaskGraphItemJson {
    this.resetInputData();
    return { ...super.toJSON(), subgraph: this.subGraph.toJSON() };
  }

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task and subtasks in JSON thats easier for humans to read
   */
  public toDependencyJSON(): JsonTaskItem {
    this.resetInputData();
    return { ...super.toDependencyJSON(), subtasks: this.subGraph.toDependencyJSON() };
  }
}

/**
 * Represents a regenerative compound task, which is a task that contains other tasks
 * and can regenerate its subtasks.
 *
 * This is useful for tasks that need to dynamically rebuild their subtask graph
 * based on changing inputs or conditions.
 */
export class RegenerativeCompoundTask<
  Input extends TaskInput = TaskInput,
  Output extends CompoundTaskOutput = CompoundTaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends CompoundTask<Input, Output, Config> {
  /**
   * The type identifier for this task class
   */
  static readonly type: TaskTypeName = "RegenerativeCompoundTask";

  /**
   * Creates a new regenerative compound task and initializes its subtask graph
   *
   * @param input Initial input values
   * @param config Task configuration
   */
  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    super(input, config);
    this.regenerateGraph();
  }

  /**
   * Regenerates the subtask graph and emits a "regenerate" event
   *
   * Subclasses should override this method to implement the actual graph
   * regeneration logic, but all they need to do is call this method to
   * emit the "regenerate" event.
   */
  public regenerateGraph(): void {
    this.events.emit("regenerate");
  }
}
