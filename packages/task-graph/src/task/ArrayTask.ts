//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { uuid4 } from "@podley/util";
import { JsonTaskItem, TaskGraphItemJson } from "../node";
import { TaskGraph } from "../task-graph/TaskGraph";
import { PROPERTY_ARRAY } from "../task-graph/TaskGraphRunner";
import { GraphAsTask } from "./GraphAsTask";
import { GraphAsTaskRunner } from "./GraphAsTaskRunner";
import { NamedGraphResult } from "../task-graph/TaskGraphRunner";
import { TaskConfig, TaskInput, TaskOutput } from "./TaskTypes";

/**
 * ArrayTask is a compound task that either:
 * 1. Executes directly if all inputs are non-arrays
 * 2. Creates a subGraph with one task instance per array element if any input is an array
 * 3. Creates all combinations if multiple inputs are arrays
 */
export class ArrayTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends GraphAsTask<Input, Output, Config> {
  /**
   * The type identifier for this task class
   */
  public static type = "ArrayTask";

  /**
   * Make this task have results that look like an array
   */
  public static readonly compoundMerge = PROPERTY_ARRAY;
  /**
   * Regenerates the task subgraph based on input arrays
   */
  public regenerateGraph(): void {
    // Check if any inputs are arrays
    const arrayInputs = new Map<string, any[]>();
    let hasArrayInputs = false;
    const inputSchema = this.inputSchema;
    const keys = Object.keys(inputSchema.properties);
    for (const inputId of keys) {
      const inputValue = this.runInputData[inputId];
      const inputDef = inputSchema.properties[inputId];

      if (inputDef.replicate === true && Array.isArray(inputValue) && inputValue.length > 1) {
        arrayInputs.set(inputId, inputValue);
        hasArrayInputs = true;
      }
    }

    // Clear the existing subgraph
    this.subGraph = new TaskGraph();

    // If no array inputs, no need to populate the subgraph
    if (!hasArrayInputs) {
      super.regenerateGraph();
      return;
    }

    // Clear the existing subgraph
    this.subGraph = new TaskGraph();

    // Create all combinations of inputs
    const inputIds = Array.from(arrayInputs.keys());
    const inputObject = Object.fromEntries(arrayInputs);
    const combinations = this.generateCombinations(inputObject as Input, inputIds);

    // Create task instances for each combination
    const tasks = combinations.map((combination) => {
      // Create a new instance of this same class
      const { id, name, ...rest } = this.config;
      const task = new (this.constructor as any)(
        { ...this.defaults, ...this.runInputData, ...combination },
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
   * Create a custom runner for ArrayTask that overrides input passing behavior
   */
  protected getRunner() {
    return new ArrayTaskRunner(this);
  }

  /**
   * Generates all possible combinations of array inputs
   * @param input Input object containing arrays
   * @param inputMakeArray Keys of properties to generate combinations for
   * @returns Array of input objects with all possible combinations
   */
  protected generateCombinations(input: Input, inputMakeArray: Array<keyof Input>): Input[] {
    // Helper function to check if a property is an array
    const isArray = (value: any): value is Array<any> => Array.isArray(value);

    // Prepare arrays for combination generation
    const arraysToCombine: any[][] = inputMakeArray.map((key) =>
      isArray(input[key]) ? input[key] : []
    );

    const indices = arraysToCombine.map(() => 0);
    const combinations: number[][] = [];
    let done = false;

    while (!done) {
      combinations.push([...indices]); // Add current combination of indices

      // Move to the next combination of indices
      for (let i = indices.length - 1; i >= 0; i--) {
        if (++indices[i] < arraysToCombine[i].length) break; // Increment current index if possible
        if (i === 0)
          done = true; // All combinations have been generated
        else indices[i] = 0; // Reset current index and move to the next position
      }
    }

    // Build objects based on the combinations
    const combos = combinations.map((combination) => {
      const result = { ...input }; // Start with a shallow copy of the input

      // Set values from the arrays based on the current combination
      combination.forEach((valueIndex, arrayIndex) => {
        const key = inputMakeArray[arrayIndex];
        if (isArray(input[key])) result[key] = input[key][valueIndex];
      });

      return result;
    });

    return combos;
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

/**
 * Custom runner for ArrayTask that passes empty input to child tasks.
 * ArrayTask child tasks get their input values from their defaults (set during task creation),
 * not from the parent task's input.
 */
class ArrayTaskRunner<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends GraphAsTaskRunner<Input, Output, Config> {
  declare task: ArrayTask<Input, Output, Config>;

  /**
   * Override to pass empty input to subgraph.
   * Child tasks will use their defaults instead of parent input.
   */
  protected async executeTaskChildren(_input: Input): Promise<NamedGraphResult<Output>> {
    return super.executeTaskChildren({} as Input);
  }
}
