//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { uuid4 } from "@ellmers/util";
import { JsonTaskItem, TaskGraphItemJson } from "../node";
import { TaskGraph } from "../task-graph/TaskGraph";
import { TaskConfig, TaskInput, TaskOutput } from "./TaskTypes";
import { GraphAsTask } from "./GraphAsTask";

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
> extends GraphAsTask<Input, Output, Config> {
  /**
   * The type identifier for this task class
   */
  public static type = "RunOrReplicate";

  /**
   * Whether this task is a compound task (contains subtasks)
   */
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
    const combinations: Input[] = [{ ...this.runInputData } as unknown as Input];

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
}
