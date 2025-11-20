/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CreateWorkflow,
  IExecuteContext,
  Task,
  TaskAbortedError,
  TaskConfig,
  TaskRegistry,
  Workflow,
} from "@podley/task-graph";
import { DataPortSchema, FromSchema, sleep } from "@podley/util";

const inputSchema = {
  type: "object",
  properties: {
    delay: {
      type: "number",
      title: "Delay (ms)",
      default: 1,
    },
    pass_through: {
      title: "Pass Through",
      description: "Pass through data to the output",
    },
  },
  additionalProperties: false,
} as const satisfies DataPortSchema;

const outputSchema = {
  type: "object",
  properties: {},
  additionalProperties: true,
} as const satisfies DataPortSchema;

export type DelayTaskInput = FromSchema<typeof inputSchema>;
export type DelayTaskOutput = FromSchema<typeof outputSchema>;

export class DelayTask<
  Input extends DelayTaskInput = DelayTaskInput,
  Output extends DelayTaskOutput = DelayTaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends Task<Input, Output, Config> {
  static readonly type = "DelayTask";
  static readonly category = "Utility";
  public static title = "Delay";
  public static description = "Delays execution for a specified duration with progress tracking";

  static inputSchema() {
    return inputSchema;
  }

  static outputSchema() {
    return outputSchema;
  }

  async execute(input: Input, executeContext: IExecuteContext): Promise<Output> {
    const delay = input.delay ?? 0;
    if (delay > 100) {
      const iterations = Math.min(100, Math.floor(delay / 16)); // 1/60fps is about 16ms
      const chunkSize = delay / iterations;
      for (let i = 0; i < iterations; i++) {
        if (executeContext.signal.aborted) {
          throw new TaskAbortedError("Task aborted");
        }
        await sleep(chunkSize);
        await executeContext.updateProgress((100 * i) / iterations, `Delaying for ${delay}ms`);
      }
    } else {
      await sleep(delay);
    }
    return input.pass_through as Output;
  }
}

// Register DelayTask with the task registry
TaskRegistry.registerTask(DelayTask);

/**
 * DelayTask
 *
 * Delays the execution of a task for a specified amount of time
 *
 * @param {delay} - The delay in milliseconds
 */
export const Delay = (input: DelayTaskInput, config: TaskConfig = {}) => {
  const task = new DelayTask(input, config);
  return task.run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    Delay: CreateWorkflow<DelayTaskInput, DelayTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.Delay = CreateWorkflow(DelayTask);
