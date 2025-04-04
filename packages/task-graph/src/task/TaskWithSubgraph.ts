//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraph } from "../task-graph/TaskGraph";
import { CompoundMergeStrategy } from "../task-graph/TaskGraphRunner";
import { Task } from "./Task";
import type { JsonTaskItem, TaskGraphItemJson } from "./TaskJSON";
import { type TaskConfig, type TaskInput, type TaskOutput, type TaskTypeName } from "./TaskTypes";
import { TaskWithSubgraphRunner } from "./TaskWithSubgraphRunner";

/**
 * A task that contains a subgraph of tasks
 */
export class TaskWithSubgraph<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends Task<Input, Output, Config> {
  // ========================================================================
  // Static properties - should be overridden by subclasses
  // ========================================================================

  public static type: TaskTypeName = "TaskWithSubgraph";
  public static category: string = "Hidden";
  public static isCompound: boolean = true;
  public static compoundMerge: CompoundMergeStrategy = "last-or-named";

  // ========================================================================
  // TaskRunner delegation - Executes and manages the task
  // ========================================================================

  /**
   * Task runner for handling the task execution
   */
  declare _runner: TaskWithSubgraphRunner<Input, Output, Config>;

  override get runner(): TaskWithSubgraphRunner<Input, Output, Config> {
    if (!this._runner) {
      this._runner = new TaskWithSubgraphRunner<Input, Output, Config>(this);
    }
    return this._runner;
  }

  /**
   * Runs the task and returns the output
   * Delegates to the task runner
   *
   * @param overrides Optional input overrides
   * @throws TaskError if the task fails
   * @returns The task output
   */
  async run(overrides: Partial<Input> = {}): Promise<Output> {
    return this.runner.run(overrides);
  }

  /**
   * Runs the task in reactive mode
   * Delegates to the task runner
   *
   * @param overrides Optional input overrides
   * @returns The task output
   */
  public async runReactive(overrides: Partial<Input> = {}): Promise<Output> {
    return this.runner.runReactive(overrides);
  }

  // ========================================================================
  // Static to Instance conversion methods
  // ========================================================================

  public get compoundMerge(): CompoundMergeStrategy {
    return (
      this.config?.compoundMerge || (this.constructor as typeof TaskWithSubgraph).compoundMerge
    );
  }

  public get cacheable(): boolean {
    return (
      // if cacheable is set in config, always use that
      this.config?.cacheable ??
      ((this.constructor as typeof TaskWithSubgraph).cacheable && !this.hasChildren())
    );
  }

  public hasChildren(): boolean {
    return (
      this._subGraph !== undefined &&
      this._subGraph !== null &&
      this._subGraph.getTasks().length > 0
    );
  }

  // ========================================================================
  // Instance properties using @template types
  // ========================================================================

  /**
   * Creates a new task instance
   *
   * @param callerDefaultInputs Default input values provided by the caller
   * @param config Configuration for the task
   */
  constructor(
    callerDefaultInputs: Partial<Input> = {} as Partial<Input>,
    config: Config = {} as Config
  ) {
    super(callerDefaultInputs, config);
    this.regenerateGraph();
  }

  // ========================================================================
  // Input/Output handling
  // ========================================================================

  /**
   * Resets input data to defaults
   */
  public resetInputData(): void {
    super.resetInputData();
    if (this.hasChildren()) {
      this.subGraph!.getTasks().forEach((node) => {
        node.resetInputData();
      });
    }
  }

  // ========================================================================
  //  Compound task methods
  // ========================================================================

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
   * Regenerates the subtask graph and emits a "regenerate" event
   *
   * Subclasses should override this method to implement the actual graph
   * regeneration logic, but all they need to do is call this method to
   * emit the "regenerate" event.
   */
  public regenerateGraph(): void {
    this.events.emit("regenerate");
  }

  // ========================================================================
  // Serialization methods
  // ========================================================================

  /**
   * Serializes the task and its subtasks into a format that can be stored
   * @returns The serialized task and subtasks
   */
  public toJSON(): JsonTaskItem | TaskGraphItemJson {
    let json = super.toJSON();
    const hasChildren = this.hasChildren();
    if (hasChildren) {
      json = {
        ...json,
        merge: this.compoundMerge,
        subgraph: this.subGraph!.toJSON(),
      };
    }
    return json;
  }

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task and subtasks in JSON thats easier for humans to read
   */
  public toDependencyJSON(): JsonTaskItem {
    const json = this.toJSON();
    if (this.hasChildren()) {
      if ("subgraph" in json) {
        delete json.subgraph;
      }
      return { ...json, subtasks: this.subGraph!.toDependencyJSON() };
    }
    return json;
  }
}
