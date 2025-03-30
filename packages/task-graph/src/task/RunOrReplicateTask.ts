//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { uuid4 } from "@ellmers/util";
import { TObject } from "@sinclair/typebox";
import { JsonTaskItem, TaskGraphItemJson } from "../node";
import { TaskGraph } from "../task-graph/TaskGraph";
import { TaskConfig, TaskInput, TaskOutput } from "./TaskTypes";
import { TaskWithSubgraph } from "./TaskWithSubgraph";

/**
 * RunOrReplicate is a compound task that either:
 * 1. Executes directly if all inputs are non-arrays
 * 2. Creates a subGraph with one task instance per array element if any input is an array
 * 3. Creates all combinations if multiple inputs are arrays
 */
export class RunOrReplicateTask<
  RunInput extends TaskInput = TaskInput,
  RunOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends TaskWithSubgraph<RunInput, RunOutput, Config> {
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
    const schema = this.inputSchema as TObject;

    for (const [inputId, prop] of Object.entries(schema.properties || {})) {
      const inputValue = this.runInputData[inputId];
      if (prop.replicate && Array.isArray(inputValue) && inputValue.length > 0) {
        arrayInputs.set(inputId, inputValue);
      }
    }

    if (arrayInputs.size === 0) return;

    this.subGraph = new TaskGraph();

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
  private generateCombinations(arrayInputs: Map<string, any[]>): RunInput[] {
    // Start with an empty object
    const combinations: RunInput[] = [{ ...this.runInputData } as unknown as RunInput];

    // For each array input, generate all combinations
    for (const [inputId, values] of arrayInputs.entries()) {
      const newCombinations: RunInput[] = [];

      // For each existing combination
      for (const combination of combinations) {
        // For each value in the array
        for (const value of values) {
          // Create a new combination with this value
          newCombinations.push({
            ...combination,
            [inputId]: value,
          } as RunInput);
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
