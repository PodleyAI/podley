//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { collectPropertyValues, Writeable } from "@ellmers/util";
import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskGraph } from "../task-graph/TaskGraph";
import { ITaskConstructor, IRunConfig, IExecuteConfig } from "./ITask";
import { TaskRegistry } from "./TaskRegistry";
import {
  Provenance,
  TaskConfig,
  TaskInput,
  TaskOutput,
  TaskOutputDefinition,
  TaskTypeName,
  TaskInputDefinition,
  TaskStatus,
} from "./TaskTypes";
import { JsonTaskItem, TaskGraphItemJson } from "./TaskJSON";
import { Task } from "./Task";

/**
 * Converts specified IO definitions to array type
 * @param io Array of input/output definitions
 * @param id Optional ID to target specific definition
 * @returns Modified array of definitions with isArray set to true
 */
function convertToArray<D extends TaskInputDefinition | TaskOutputDefinition>(
  io: D[],
  id?: string | number | symbol
) {
  const results: D[] = [];
  for (const item of io) {
    const newItem: Writeable<D> = { ...item };
    if (newItem.id === id || id === undefined) {
      newItem.isArray = true;
    }
    results.push(newItem);
  }
  return results as D[];
}

/**
 * Converts multiple IO definitions to array type based on provided IDs
 * @param io Array of input/output definitions
 * @param ids Array of IDs to target specific definitions
 * @returns Modified array of definitions with isArray set to true for matching IDs
 */
function convertMultipleToArray<D extends TaskInputDefinition | TaskOutputDefinition>(
  io: D[],
  ids: Array<string | number | symbol>
) {
  const results: D[] = [];
  for (const item of io) {
    const newItem: Writeable<D> = { ...item };
    if (ids.includes(newItem.id)) {
      newItem.isArray = true;
    }
    results.push(newItem);
  }
  return results as D[];
}

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
  const inputs = convertMultipleToArray<TaskInputDefinition>(
    Array.from(taskClass.inputs),
    inputMakeArray
  );
  const outputs = convertToArray<TaskOutputDefinition>(Array.from(taskClass.outputs));

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
  > extends Task<Input, Output, Config> {
    static readonly type: TaskTypeName = name!;
    static readonly runtype = taskClass.type;
    static readonly category = taskClass.category;
    static readonly sideeffects = taskClass.sideeffects;
    static readonly isCompound = true;

    itemClass = taskClass;

    static inputs = inputs;
    static outputs = outputs;

    /**
     * Regenerates the task graph by creating child tasks for each input combination
     * Each child task processes a single combination of the array inputs
     */
    regenerateGraph() {
      if (this.status !== TaskStatus.PENDING) {
        console.warn("ArrayTask.regenerateGraph called on non-pending task", this.status);
        return;
      }
      //TODO: only regenerate if we need to
      this.subGraph = new TaskGraph(this.outputCache);
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

    /**
     * Runs the task reactively, collecting outputs from all child tasks into arrays
     * @returns Combined output with arrays of values from all child tasks
     */
    public async execute(input: Input, config: IExecuteConfig): Promise<Output> {
      const results = await this.subGraph!.run({
        parentProvenance: config.nodeProvenance || {},
        parentSignal: config.signal || undefined,
        outputCache: this.outputCache,
      });
      const outputs = results.map((result: any) => result.data);
      if (outputs.length > 0) {
        const collected = collectPropertyValues<SingleOutputType>(outputs as SingleOutputType[]);
        if (Object.keys(collected).length > 0) {
          this.runOutputData = collected as unknown as Output;
        }
      }
      return this.runOutputData;
    }

    // Task runs this on compound tasks
    public async executeReactive(input: Input, output: Output): Promise<Output> {
      return output;
    }
    /**
     * Default implementation of runReactive that just returns the current output data.
     * Subclasses should override this to provide actual reactive functionality.
     *
     * This is generally for UI updating, and should be lightweight.
     *
     * @returns The task output
     */
    public async runReactive(overrides: Partial<Input> = {}): Promise<Output> {
      this.setInput(overrides);
      try {
        await this.validateInputData(this.runInputData);
      } catch {
        return {} as Output;
      }

      const results = await this.subGraph!.runReactive();
      const mapped = results.map((result) => result.data) as SingleOutputType[];
      const collected = collectPropertyValues<SingleOutputType>(mapped);
      this.runOutputData = collected as unknown as Output;

      return this.runOutputData;
    }

    toJSON(): JsonTaskItem {
      const { subgraph, ...result } = super.toJSON() as TaskGraphItemJson;
      return result;
    }

    toDependencyJSON(): JsonTaskItem {
      const { subtasks, ...result } = super.toDependencyJSON() as JsonTaskItem;
      return result;
    }

    async validateItem(valueType: string, item: any) {
      return true; // let children validate
    }

    declare _subGraph: TaskGraph;
    declare abortController: AbortController;
    declare nodeProvenance: Provenance;
    declare outputCache: TaskOutputRepository;
    declare queueName: string;
    declare currentJobId: string;
    declare handleComplete: () => void;
    declare handleError: (error: Error) => void;
    declare handleProgress: (progress: number) => void;
    declare handleStart: () => void;
    declare runInternal: (config: IRunConfig) => Promise<Output>;
    declare validateInputData: (input: Partial<Input>) => Promise<boolean>;
  }

  // Use type assertion to make TypeScript accept the registration
  TaskRegistry.registerTask(ArrayTask);

  return ArrayTask;
}
