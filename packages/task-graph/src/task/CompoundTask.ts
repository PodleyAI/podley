//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskGraph, type TaskGraphItemJson } from "../task-graph/TaskGraph";
import { TaskGraphRunner } from "../task-graph/TaskGraphRunner";
import {
  type ITaskCompound,
  type TaskTypeName,
  type TaskOutput,
  type TaskInput,
  TaskStatus,
  type JsonTaskItem,
} from "./Task";
import { TaskBase } from "./TaskBase";

/**
 * Represents a compound task, which is a task that contains other tasks
 */

export class CompoundTask extends TaskBase implements ITaskCompound {
  static readonly type: TaskTypeName = "CompoundTask";

  declare runOutputData: TaskOutput;
  readonly isCompound = true;
  _subGraph: TaskGraph | null = null;
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
  get subGraph() {
    if (!this._subGraph) {
      this._subGraph = new TaskGraph();
    }
    return this._subGraph;
  }
  /**
   * Resets the input data for the compound task and its subtasks
   */
  resetInputData() {
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
  async run(
    nodeProvenance: TaskInput = {},
    repository?: TaskOutputRepository
  ): Promise<TaskOutput> {
    if (!this.validateInputData(this.runInputData)) throw new Error("Invalid input data");
    if (this.status === TaskStatus.ABORTING) {
      throw new Error("Task aborted by run time");
    }
    this.emit("start");
    const runner = new TaskGraphRunner(this.subGraph, repository);
    try {
      this.runOutputData.outputs = await runner.runGraph(nodeProvenance);
    } catch (err) {
      this.emit("error", err);
      throw err;
    }
    this.emit("complete");
    return this.runOutputData;
  }
  async runReactive(): Promise<TaskOutput> {
    const runner = new TaskGraphRunner(this.subGraph);
    this.runOutputData.outputs = await runner.runGraphReactive();
    return this.runOutputData;
  }

  async abort() {
    super.abort();
    this.subGraph.getNodes().forEach((node) => {
      node.abort();
    });
  }

  /**
   * This serializes the task and its subtasks into a format that can be stored in a database
   * @returns TaskExportFormat
   */
  toJSON(): TaskGraphItemJson {
    this.resetInputData();
    return { ...super.toJSON(), subgraph: this.subGraph.toJSON() };
  }
  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task in JSON format
   */
  toDependencyJSON(): JsonTaskItem {
    this.resetInputData();
    return { ...super.toDependencyJSON(), subtasks: this.subGraph.toDependencyJSON() };
  }
}

/**
 * Represents a regenerative compound task, which is a task that contains other tasks and can regenerate its subtasks
 */
export class RegenerativeCompoundTask extends CompoundTask {
  static readonly type: TaskTypeName = "CompoundTask";
  /**
   * Emits a "regenerate" event when the subtask graph is regenerated
   */
  public regenerateGraph() {
    this.emit("regenerate", this.subGraph);
  }
}
