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
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskConfig,
  Task,
  IExecuteConfig,
} from "@ellmers/task-graph";

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

  /**
   * Input definition for LambdaTask
   * - fn: The function to execute
   * - input: Optional input data to pass to the function
   */
  public static inputs: TaskInputDefinition[] = [
    {
      id: "input",
      name: "Input",
      valueType: "any", // Can accept any type of input
    },
  ] as const;

  /**
   * Output definition for LambdaTask
   * The output will be whatever the provided function returns
   */
  public static outputs: TaskOutputDefinition[] = [
    {
      id: "output",
      name: "Output",
      valueType: "any", // Can return any type of value
    },
  ] as const;

  async execute(input: Input, config: IExecuteConfig): Promise<Output> {
    let results: Output = {} as Output;
    if (typeof this.config.execute === "function") {
      results = await this.config.execute(input, config);
    }
    return results;
  }

  /**
   * Executes the provided function with the given input
   * Throws an error if no function is provided or if the provided value is not callable
   */
  async executeReactive(input: Input, output: Output) {
    let results: Output = {} as Output;
    if (typeof this.config.executeReactive === "function") {
      results = await this.config.executeReactive(input, output);
    }
    return results;
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
