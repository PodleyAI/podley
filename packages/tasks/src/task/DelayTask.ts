//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  DATAFLOW_ALL_PORTS,
  SingleTask,
  TaskAbortedError,
  TaskInput,
  TaskOutput,
  TaskRegistry,
  Workflow,
} from "@ellmers/task-graph";
import { sleep } from "@ellmers/util";

// TODO: we should have a generic way to handle "...rest" inputs to pass through to outputs
export type DelayTaskInput = TaskInput & {
  delay: number;
};
export type DelayTaskOutput = TaskOutput;

export class DelayTask extends SingleTask {
  static readonly type = "DelayTask";
  static readonly category = "Utility";
  declare runInputData: DelayTaskInput;
  declare runOutputData: DelayTaskOutput;
  static inputs = [
    {
      id: "delay",
      name: "Delay (ms)",
      valueType: "number",
      defaultValue: 1,
    },
    {
      id: DATAFLOW_ALL_PORTS,
      name: "Input",
      valueType: "any",
    },
  ] as const;
  static outputs = [
    {
      id: DATAFLOW_ALL_PORTS,
      name: "Output",
      valueType: "any",
    },
  ] as const;

  async runFull(): Promise<DelayTaskOutput> {
    const delay = this.runInputData.delay;
    console.log("delay", delay, this.runInputData);
    if (delay > 100) {
      const iterations = Math.min(100, Math.floor(delay / 16)); // 1/60fps is about 16ms
      const chunkSize = delay / iterations;
      for (let i = 0; i < iterations; i++) {
        if (this.abortController?.signal.aborted) {
          throw new TaskAbortedError("Task aborted");
        }
        await sleep(chunkSize);
        this.handleProgress(i / iterations);
      }
    } else {
      await sleep(delay);
    }
    return this.runReactive();
  }

  async runReactive(): Promise<DelayTaskOutput> {
    const { delay, ...input } = this.runInputData;
    this.runOutputData = input;
    return this.runOutputData;
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
export const Delay = (input: DelayTaskInput) => {
  const task = new DelayTask({ input });
  return task.run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    Delay: CreateWorkflow<DelayTaskInput>;
  }
}

Workflow.prototype.Delay = CreateWorkflow(DelayTask);
