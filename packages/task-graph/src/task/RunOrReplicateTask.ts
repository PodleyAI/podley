//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { uuid4 } from "@ellmers/util";
import { JsonTaskItem, TaskGraphItemJson } from "../node";
import { TaskGraph } from "../task-graph/TaskGraph";
import { AnyGraphResult, NamedGraphResult } from "../task-graph/TaskGraphRunner";
import { Task } from "./Task";
import { TaskConfig, TaskInput, TaskOutput } from "./TaskTypes";
import { TaskRunner } from "./TaskRunner";

/**
 * RunOrReplicate is a compound task that either:
 * 1. Executes directly if all inputs are non-arrays
 * 2. Creates a subGraph with one task instance per array element if any input is an array
 * 3. Creates all combinations if multiple inputs are arrays
 */
export class RunOrReplicateTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends Task<Input, Output, Config> {
  /**
   * The type identifier for this task class
   */
  public static type = "RunOrReplicate";

  /**
   * Whether this task is a compound task (contains subtasks)
   */
  public static readonly isCompound = true;
  public static readonly compoundMerge = "last-or-property-array";

  /**
   * Regenerates the task subgraph based on input arrays
   */
  public regenerateGraph(): void {
    // Check if any inputs are arrays
    const arrayInputs = new Map<string, any[]>();
    let hasArrayInputs = false;
    for (const inputDef of this.inputs) {
      const inputId = inputDef.id;
      const inputValue = this.runInputData[inputId];

      if (inputDef.isArray === "replicate" && Array.isArray(inputValue) && inputValue.length > 0) {
        arrayInputs.set(inputId, inputValue);
        hasArrayInputs = true;
      }
    }

    // If no array inputs, no need to create a subgraph
    if (!hasArrayInputs) return;

    // Clear the existing subgraph
    this.subGraph = new TaskGraph();

    // Create all combinations of inputs
    const combinations = this.generateCombinations(arrayInputs);

    // Create task instances for each combination
    const tasks = combinations.map((combination) => {
      // Create a new instance of this same class
      const { id, name, ...rest } = this.config;
      const task = new (this.constructor as any)(
        { ...this.defaults, ...combination },
        { ...rest, id: `${id}_${uuid4()}` }
      );
      return task;
    });

    // Add tasks to subgraph
    this.subGraph.addTasks(tasks);

    // Emit regenerate event
    super.regenerateGraph();
  }

  /**
   * Generate all combinations of array inputs
   */
  private generateCombinations(arrayInputs: Map<string, any[]>): Input[] {
    // Start with an empty object
    const combinations: Input[] = [{ ...this.runInputData }];

    // For each array input, generate all combinations
    for (const [inputId, values] of arrayInputs.entries()) {
      const newCombinations: Input[] = [];

      // For each existing combination
      for (const combination of combinations) {
        // For each value in the array
        for (const value of values) {
          // Create a new combination with this value
          newCombinations.push({
            ...combination,
            [inputId]: value,
          } as Input);
        }
      }

      // Replace combinations with new ones
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    return combinations;
  }

  toJSON(): JsonTaskItem {
    const { subgraph, ...result } = super.toJSON() as TaskGraphItemJson;
    return result;
  }

  toDependencyJSON(): JsonTaskItem {
    const { subtasks, ...result } = super.toDependencyJSON() as JsonTaskItem;
    return result;
  }

  // Declare specific _runner type for this class
  declare _runner: RunOrReplicateTaskRunner<Input, Output, Config>;

  override get runner(): RunOrReplicateTaskRunner<Input, Output, Config> {
    if (!this._runner) {
      this._runner = new RunOrReplicateTaskRunner<Input, Output, Config>(this);
    }
    return this._runner;
  }
}

export class RunOrReplicateTaskRunner<
  Input extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunOutput extends TaskOutput = ExecuteOutput,
> extends TaskRunner<Input, ExecuteOutput, Config, RunOutput> {
  // ========================================================================
  // Utility methods
  // ========================================================================

  private fixInput(input: Input): Input {
    // inputs has turned each property into an array, so we need to flatten the input
    const flattenedInput = Object.entries(input).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        return { ...acc, [key]: value[0] };
      }
      return { ...acc, [key]: value };
    }, {});
    return flattenedInput as Input;
  }

  // ========================================================================
  // TaskRunner method overrides and helpers
  // ========================================================================

  /**
   * Execute the task
   */
  protected async executeTask(): Promise<RunOutput | undefined> {
    this.task.runInputData = this.fixInput(this.task.runInputData);
    const result = await super.executeTask();
    if (result !== undefined) {
      this.task.runOutputData = result as RunOutput;
    }
    return this.task.executeReactive(this.task.runInputData, this.task.runOutputData);
  }

  /**
   * Execute the task reactively
   */
  public async executeTaskReactive(): Promise<RunOutput | undefined> {
    if (this.task.hasChildren()) {
      return await this.executeTaskChildrenReactive();
    } else {
      this.task.runInputData = this.fixInput(this.task.runInputData);
      return this.task.executeReactive(this.task.runInputData, this.task.runOutputData);
    }
  }
}
