//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  DATAFLOW_ALL_PORTS,
  IExecuteContext,
  IExecuteReactiveContext,
  Task,
  TaskConfig,
  TaskConfigurationError,
  TaskInput,
  TaskOutput,
  TaskRegistry,
  Workflow,
  type JSONSchema7ObjectDefinition,
} from "@podley/task-graph";
import { TObject, Type } from "@sinclair/typebox";

interface LambdaTaskConfig<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> extends TaskConfig {
  execute?: (input: Input, context: IExecuteContext) => Promise<Output>;
  executeReactive?: (
    input: Input,
    output: Output,
    context: IExecuteReactiveContext
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
  public static type = "LambdaTask";
  public static category = "Hidden";
  public static cacheable = true;

  constructor(input: Partial<Input> = {}, config: Partial<Config> = {}) {
    if (!config.execute && !config.executeReactive) {
      throw new TaskConfigurationError(
        "LambdaTask must have either execute or executeReactive function in config"
      );
    }
    super(input, config as Config);
  }

  /**
   * Input schema for LambdaTask
   * - input: Optional input data to pass to the function
   */
  public static inputSchema(): JSONSchema7ObjectDefinition {
    return Type.Object({
      [DATAFLOW_ALL_PORTS]: Type.Optional(
        Type.Any({
          title: "Input",
          description: "Input data to pass to the function",
        })
      ),
    }) as JSONSchema7ObjectDefinition;
  }

  /**
   * Output schema for LambdaTask
   * The output will be whatever the provided function returns
   */
  public static outputSchema(): JSONSchema7ObjectDefinition {
    return Type.Object({
      [DATAFLOW_ALL_PORTS]: Type.Any({
        title: "Output",
        description: "The output from the execute function",
      }),
    }) as JSONSchema7ObjectDefinition;
  }

  async execute(input: Input, context: IExecuteContext): Promise<Output> {
    if (typeof this.config.execute === "function") {
      return await this.config.execute(input, context);
    }
    return {} as Output;
  }

  /**
   * Executes the provided function with the given input
   * Throws an error if no function is provided or if the provided value is not callable
   */
  async executeReactive(input: Input, output: Output, context: IExecuteReactiveContext) {
    if (typeof this.config.executeReactive === "function") {
      return (await this.config.executeReactive(input, output, context)) ?? output;
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
  fn: (input: I, context: IExecuteContext) => Promise<O>
): Promise<TaskOutput>;
export function Lambda<I extends TaskInput, O extends TaskOutput>(
  input: I,
  config?: LambdaTaskConfig<I, O>
): Promise<TaskOutput>;

export function Lambda<I extends TaskInput, O extends TaskOutput>(
  input: I | ((input: I, context: IExecuteContext) => Promise<O>),
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
declare module "@podley/task-graph" {
  interface Workflow {
    Lambda: <I extends TaskInput, O extends TaskOutput>(
      input: Partial<I>,
      config: LambdaTaskConfig<I, O>
    ) => Workflow;
  }
}

Workflow.prototype.Lambda = CreateWorkflow(LambdaTask);
