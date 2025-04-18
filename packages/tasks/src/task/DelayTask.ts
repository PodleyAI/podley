//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  IExecuteConfig,
  Task,
  TaskAbortedError,
  TaskConfig,
  TaskOutput,
  TaskRegistry,
  Workflow,
} from "@ellmers/task-graph";
import { sleep } from "@ellmers/util";
import { Type } from "@sinclair/typebox";

export type DelayTaskInput = {
  delay: number;
  pass_through: any;
};
export type DelayTaskOutput = TaskOutput;

export class DelayTask<
  Input extends DelayTaskInput = DelayTaskInput,
  Output extends DelayTaskOutput = DelayTaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends Task<Input, Output, Config> {
  static readonly type = "DelayTask";
  static readonly category = "Utility";

  static inputSchema = Type.Object({
    delay: Type.Optional(
      Type.Number({
        title: "Delay (ms)",
        default: 1,
      })
    ),
    pass_through: Type.Optional(
      Type.Any({
        title: "Pass Through",
        description: "Pass through data to the output",
      })
    ),
  });

  static outputSchema = Type.Object({});

  async execute(input: Input, executeConfig: IExecuteConfig): Promise<Output> {
    const delay = input.delay;
    if (delay > 100) {
      const iterations = Math.min(100, Math.floor(delay / 16)); // 1/60fps is about 16ms
      const chunkSize = delay / iterations;
      for (let i = 0; i < iterations; i++) {
        if (executeConfig.signal.aborted) {
          throw new TaskAbortedError("Task aborted");
        }
        await sleep(chunkSize);
        executeConfig.updateProgress((100 * i) / iterations, `Delaying for ${delay}ms`);
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

declare module "@ellmers/task-graph" {
  interface Workflow {
    Delay: CreateWorkflow<DelayTaskInput, DelayTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.Delay = CreateWorkflow(DelayTask);
