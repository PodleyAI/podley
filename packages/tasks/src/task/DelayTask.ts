//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  IExecuteContext,
  Task,
  TaskAbortedError,
  TaskConfig,
  TaskRegistry,
  Workflow,
  type DataPortSchema,
} from "@podley/task-graph";
import { sleep } from "@podley/util";
import { z } from "zod";

const inputSchema = z.object({
  delay: z.number().default(1).describe("Delay (ms)"),
  pass_through: z.any().optional().describe("Pass through data to the output"),
});
const outputSchema = z.object({});

export type DelayTaskInput = z.infer<typeof inputSchema>;
export type DelayTaskOutput = z.infer<typeof outputSchema>;

export class DelayTask<
  Input extends DelayTaskInput = DelayTaskInput,
  Output extends DelayTaskOutput = DelayTaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends Task<Input, Output, Config> {
  static readonly type = "DelayTask";
  static readonly category = "Utility";
  public static title = "Delay";
  public static description = "Delays execution for a specified duration with progress tracking";

  static inputSchema(): DataPortSchema {
    return inputSchema as DataPortSchema;
  }

  static outputSchema(): DataPortSchema {
    return outputSchema as DataPortSchema;
  }

  async execute(input: Input, executeContext: IExecuteContext): Promise<Output> {
    const delay = input.delay;
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
