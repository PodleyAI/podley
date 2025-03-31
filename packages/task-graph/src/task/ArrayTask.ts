//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskOutputRepository } from "../storage/TaskOutputRepository";
import { TaskGraph } from "../task-graph/TaskGraph";
import { ITaskConstructor } from "./ITask";
import { JsonTaskItem, TaskGraphItemJson } from "./TaskJSON";
import { TaskRegistry } from "./TaskRegistry";
import { Provenance, TaskConfig, TaskInput, TaskOutput, TaskTypeName } from "./TaskTypes";
import { Type, TSchema, TObject } from "@sinclair/typebox";
import { TaskWithSubgraph } from "./TaskWithSubgraph";
import { EventEmitter } from "@ellmers/util";
import { TaskEventListeners } from "./TaskEvents";

/**
 * Generates all possible combinations of array inputs
 * @param input Input object containing arrays
 * @param inputMakeArray Keys of properties to generate combinations for
 * @returns Array of input objects with all possible combinations
 */
function generateCombinations<T, K extends keyof T>(input: T, inputMakeArray: K[]): T[] {
  // Helper function to check if a property is an array
  const isArray = (value: any): value is Array<any> => Array.isArray(value);

  // Prepare arrays for combination generation
  const arraysToCombine: any[][] = inputMakeArray.map((key) =>
    isArray(input[key]) ? input[key] : []
  );

  // Initialize indices and combinations
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

/**
 * Factory function to create array-based task classes
 * Creates a task that can process arrays of inputs in parallel
 * @param taskClass Base task class to wrap
 * @param inputMakeArray Array of input keys to process as arrays
 * @param name Optional name for the generated task class
 * @returns New task class that handles array inputs
 */
export function arrayTaskFactory<
  PluralInputType extends TaskInput,
  PluralOutputType extends TaskOutput,
  SingleInputType extends TaskInput,
  SingleOutputType extends TaskOutput,
  SingleConfig extends TaskConfig = TaskConfig,
>(
  taskClass: ITaskConstructor<SingleInputType, SingleOutputType, SingleConfig>,
  inputMakeArray: Array<keyof PluralInputType>,
  name?: string
) {
  const nameWithoutTask = taskClass.type.slice(0, -4);
  name ??= nameWithoutTask + "ArrayTask";

  /**
   * A task class that handles array-based processing by creating subtasks for each combination of inputs
   * Extends RegenerativeCompoundTask to manage a collection of child tasks running in parallel
   */
  class ArrayTask<
    Input extends PluralInputType = PluralInputType,
    Output extends PluralOutputType = PluralOutputType,
    Config extends SingleConfig = SingleConfig,
  > extends TaskWithSubgraph<Input, Output, Config> {
    static readonly type: TaskTypeName = name!;
    static readonly runtype = taskClass.type;
    static readonly category = taskClass.category;
    static readonly cacheable = taskClass.cacheable;
    static readonly compoundMerge = "last-or-property-array";
    itemClass = taskClass;

    /**
     * Input schema for ArrayTask
     * Inherits from the base task class but converts specified properties to arrays
     */
    public static inputSchema = Type.Object(
      Object.fromEntries(
        Object.entries(((taskClass as any).inputSchema as TObject)?.properties || {}).map(
          ([key, prop]) => [
            key,
            inputMakeArray.includes(key)
              ? Type.Array(prop as TSchema, {
                  description: `Array of ${(prop as TSchema).description || key}`,
                })
              : prop,
          ]
        )
      )
    );

    /**
     * Output schema for ArrayTask
     * Converts all outputs to arrays since we're processing multiple items
     */
    public static outputSchema = Type.Object(
      Object.fromEntries(
        Object.entries(((taskClass as any).outputSchema as TObject)?.properties || {}).map(
          ([key, prop]) => [
            key,
            Type.Array(prop as TSchema, {
              description: `Array of ${(prop as TSchema).description || key}`,
            }),
          ]
        )
      )
    );

    /**
     * Regenerates the task graph by creating child tasks for each input combination
     * Each child task processes a single combination of the array inputs
     */
    regenerateGraph() {
      this.subGraph = new TaskGraph();
      const combinations = generateCombinations<Input, keyof Input>(
        this.runInputData,
        inputMakeArray as (keyof Input)[]
      );
      combinations.forEach((input, index) => {
        const current = new taskClass(
          input as unknown as SingleInputType,
          {
            id: this.config.id + "-child-" + (index + 1),
            outputCache: this.outputCache,
          } as SingleConfig
        );
        this.subGraph!.addTask(current);
      });
      super.regenerateGraph();
    }

    toJSON(): JsonTaskItem {
      const { subgraph, ...result } = super.toJSON() as TaskGraphItemJson;
      return result;
    }

    toDependencyJSON(): JsonTaskItem {
      const { subtasks, ...result } = super.toDependencyJSON() as JsonTaskItem;
      return result;
    }

    declare _subGraph: TaskGraph;
    declare _events: EventEmitter<TaskEventListeners>;
    declare abortController: AbortController;
    declare nodeProvenance: Provenance;
    declare outputCache: TaskOutputRepository;
    declare queueName: string;
    declare currentJobId: string;
    declare validateInput: (input: Partial<Input>) => Promise<boolean>;
  }

  // Use type assertion to make TypeScript accept the registration
  TaskRegistry.registerTask(ArrayTask);

  return ArrayTask;
}
