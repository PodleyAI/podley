//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskOutput,
  Workflow,
  CreateWorkflow,
  TaskRegistry,
  TaskInput,
  TaskConfig,
  Task,
  IExecuteConfig,
} from "@ellmers/task-graph";
import { Type } from "@sinclair/typebox";

type LambdaTaskConfig<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> = Partial<TaskConfig> & {
  execute?: (input: Input, config: IExecuteConfig) => Promise<Output>;
  executeReactive?: (input: Input, output: Output) => Promise<Output>;
};

/**
 * LambdaTask provides a way to execute arbitrary functions within the task framework
 * It wraps a provided function and its input into a task that can be integrated
 * into task graphs and workflows
 */
export class LambdaTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends LambdaTaskConfig<Input, Output> = LambdaTaskConfig<Input, Output>,
> extends Task<Input, Output, Config> {
  static readonly type = "LambdaTask";
  static readonly category = "Utility";
  static readonly cacheable = true;
  static readonly isCompound = false;

  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    if (!config.execute && !config.executeReactive) {
      throw new Error("LambdaTask must have either execute or executeReactive function in config");
    }
    super(input, config);
  }

  /**
   * Input schema for LambdaTask
   * - input: Optional input data to pass to the function
   */
  public static inputSchema = Type.Object({
    input: Type.Optional(
      Type.Any({
        title: "Input",
        description: "Input data to pass to the function",
      })
    ),
  });

  /**
   * Output schema for LambdaTask
   * The output will be whatever the provided function returns
   */
  public static outputSchema = Type.Object({
    output: Type.Optional(
      Type.Any({
        title: "Output",
        description: "Output data from the function",
      })
    ),
  });

  async execute(input: Input, config: IExecuteConfig): Promise<Output> {
    if (typeof this.config.execute === "function") {
      return await this.config.execute(input, config);
    }
    return {} as Output;
  }

  /**
   * Executes the provided function with the given input
   * Throws an error if no function is provided or if the provided value is not callable
   */
  async executeReactive(input: Input, output: Output) {
    if (typeof this.config.executeReactive === "function") {
      return (await this.config.executeReactive(input, output)) ?? output;
    }
    return output;
  }
}

// Register LambdaTask with the task registry
TaskRegistry.registerTask(LambdaTask);

/**
 * Convenience function to create and run a LambdaTask
 */
export const Lambda = (input: TaskInput, config: LambdaTaskConfig) => {
  const task = new LambdaTask(input, config);
  return task.run();
};

// Add Lambda task workflow to Workflow interface
declare module "@ellmers/task-graph" {
  interface Workflow {
    Lambda: CreateWorkflow<TaskInput, TaskOutput, LambdaTaskConfig>;
  }
}

Workflow.prototype.Lambda = CreateWorkflow(LambdaTask);
