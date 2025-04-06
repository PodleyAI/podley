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
  IExecuteReactiveConfig,
  DATAFLOW_ALL_PORTS,
} from "@ellmers/task-graph";

interface LambdaTaskConfig<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> extends TaskConfig {
  execute?: (input: Input, config: IExecuteConfig) => Promise<Output>;
  executeReactive?: (
    input: Input,
    output: Output,
    config: IExecuteReactiveConfig
  ) => Promise<Output>;
}

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

  constructor(input: Partial<Input> = {}, config: Partial<Config> = {}) {
    if (!config.execute && !config.executeReactive) {
      throw new Error("LambdaTask must have either execute or executeReactive function in config");
    }
    super(input, config as Config);
  }

  /**
   * Input definition for LambdaTask
   * - fn: The function to execute
   * - input: Optional input data to pass to the function
   */
  public static inputs: TaskInputDefinition[] = [
    {
      id: DATAFLOW_ALL_PORTS, // Can accept any port
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
      id: DATAFLOW_ALL_PORTS, // Can return on any port
      name: "Output",
      valueType: "any", // Can return any type of value
    },
  ] as const;

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
  async executeReactive(input: Input, output: Output, config: IExecuteReactiveConfig) {
    if (typeof this.config.executeReactive === "function") {
      return (await this.config.executeReactive(input, output, config)) ?? output;
    }
    return output;
  }
}

// Register LambdaTask with the task registry
TaskRegistry.registerTask(LambdaTask);

export function process(value: string): string;
export function process(value: number): number;
export function process(value: boolean): string;

// Implementation
export function process(value: string | number | boolean): string | number {
  if (typeof value === "string") return `Processed: ${value}`;
  if (typeof value === "number") return value * 2;
  return value ? "True" : "False";
}
/**
 * Convenience function to create and run a LambdaTask
 */
export function Lambda<I extends TaskInput, O extends TaskOutput>(
  fn: (input: I, config: IExecuteConfig) => Promise<O>
): Promise<TaskOutput>;
export function Lambda<I extends TaskInput, O extends TaskOutput>(
  input: I,
  config?: LambdaTaskConfig<I, O>
): Promise<TaskOutput>;

export function Lambda<I extends TaskInput, O extends TaskOutput>(
  input: I | ((input: I, config: IExecuteConfig) => Promise<O>),
  config?: LambdaTaskConfig<I, O>
): Promise<TaskOutput> {
  if (typeof input === "function") {
    type Input = Parameters<typeof input>[0];
    const task = new LambdaTask<Input, O>({} as Input, {
      execute: input,
    });
    return task.run();
  }
  const task = new LambdaTask<I, O>(input, config);
  return task.run();
}

// Add Lambda task workflow to Workflow interface
declare module "@ellmers/task-graph" {
  interface Workflow {
    Lambda: <I extends TaskInput, O extends TaskOutput>(
      input: Partial<I>,
      config: LambdaTaskConfig<I, O>
    ) => Workflow;
  }
}

Workflow.prototype.Lambda = CreateWorkflow(LambdaTask);
