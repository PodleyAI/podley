/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CreateWorkflow,
  IExecuteContext,
  Task,
  TaskConfig,
  TaskRegistry,
  Workflow,
} from "@workglow/task-graph";
import { DataPortSchema, FromSchema } from "@workglow/util";

const inputSchema = {
  type: "object",
  properties: {},
  additionalProperties: true,
} as const satisfies DataPortSchema;

const outputSchema = {
  type: "object",
  properties: {
    output: {
      type: "array",
      title: "Merged Array",
      description: "Array containing all input values in order",
    },
  },
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type ArrayMergeTaskInput = FromSchema<typeof inputSchema>;
export type ArrayMergeTaskOutput = FromSchema<typeof outputSchema>;

/**
 * ArrayMergeTask takes multiple inputs and merges them into a single array output.
 * Input properties are collected and sorted by key name to create a deterministic output order.
 * Useful for collecting results from parallel branches into a single array.
 *
 * Features:
 * - Accepts any number of input properties (additionalProperties: true)
 * - Merges all input values into a single array output
 * - Sorts inputs by property name for consistent ordering
 * - Output is always an array
 *
 * Example:
 * Input: { input_0: "a", input_1: "b", input_2: "c" }
 * Output: { output: ["a", "b", "c"] }
 */
export class ArrayMergeTask<
  Input extends ArrayMergeTaskInput = ArrayMergeTaskInput,
  Output extends ArrayMergeTaskOutput = ArrayMergeTaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends Task<Input, Output, Config> {
  public static type = "ArrayMergeTask";
  public static category = "Array";
  public static title = "Array Merge";
  public static description = "Merges multiple inputs into a single array output";
  static readonly cacheable = true;

  public static inputSchema() {
    return inputSchema;
  }

  public static outputSchema() {
    return outputSchema;
  }

  async execute(input: Input, context: IExecuteContext): Promise<Output> {
    // Get all input keys and sort them for deterministic order
    const keys = Object.keys(input).sort();

    // Collect values in sorted order
    const values = keys.map((key) => input[key]);

    return {
      output: values,
    } as Output;
  }
}

TaskRegistry.registerTask(ArrayMergeTask);

export const ArrayMerge = (input: ArrayMergeTaskInput, config: TaskConfig = {}) => {
  const task = new ArrayMergeTask(input, config);
  return task.run();
};

declare module "@workglow/task-graph" {
  interface Workflow {
    ArrayMerge: CreateWorkflow<ArrayMergeTaskInput, ArrayMergeTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.ArrayMerge = CreateWorkflow(ArrayMergeTask);
