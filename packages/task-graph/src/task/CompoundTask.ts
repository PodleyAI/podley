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

export type CompoundTaskOutput = {
  outputs?: TaskOutput[];
  [key: string]: TaskOutput[] | undefined;
};

/**
 * Represents a compound task, which is a task that contains other tasks.
 * This is the base class for all compound tasks that manage subtasks.
 */
export class CompoundTask<
    Input extends TaskInput = TaskInput,
    Output extends CompoundTaskOutput = CompoundTaskOutput,
    Config extends TaskConfig = TaskConfig,
  >
  extends TaskBase<Input, Output, Config>
  implements ICompoundTask<Input, Output>
{
  static readonly type: TaskTypeName = "CompoundTask";
  static readonly category: string = "Hidden";
  static readonly sideeffects: boolean = false;

  readonly isCompound = true;

  public _subGraph: TaskGraph | null = null;

  /**
   * Sets the subtask graph for the compound task
   * @param subGraph The subtask graph to set
   */
  set subGraph(subGraph: TaskGraph) {
    this._subGraph = subGraph;
  }
  /**
   * Gets the subtask graph for the compound task
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
   * Runs the compound task
   * @param nodeProvenance The provenance for the subtasks
   * @param repository The repository to use for caching task outputs
   * @returns The output of the compound task
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
   * Runs the compound all its subtasks reactively
   */
  public async runReactive(): Promise<Output> {
    const runner = new TaskGraphRunner(this.subGraph);
    this.runOutputData.outputs = await runner.runGraphReactive();
    return this.runOutputData;
  }

  /**
   * Serializes the task and its subtasks into a format that can be stored
   */
  public toJSON(): TaskGraphItemJson {
    this.resetInputData();
    return { ...super.toJSON(), subgraph: this.subGraph.toJSON() };
  }

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   */
  public toDependencyJSON(): JsonTaskItem {
    this.resetInputData();
    return { ...super.toDependencyJSON(), subtasks: this.subGraph.toDependencyJSON() };
  }
}

/**
 * Represents a regenerative compound task, which is a task that contains other tasks
 * and can regenerate its subtasks.
 */
export class RegenerativeCompoundTask<
  Input extends TaskInput = TaskInput,
  Output extends CompoundTaskOutput = CompoundTaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends CompoundTask<Input, Output, Config> {
  static readonly type: TaskTypeName = "RegenerativeCompoundTask";
  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    super(input, config);
    this.regenerateGraph();
  }
  /**
   * Emits a "regenerate" event when the subtask graph is regenerated
   */
  public regenerateGraph(): void {
    this.events.emit("regenerate");
  }
}
