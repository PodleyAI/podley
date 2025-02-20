//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  SingleTask,
  TaskConfig,
  TaskOutput,
  TaskGraphBuilder,
  TaskGraphBuilderHelper,
  TaskRegistry,
  TaskInput,
  TaskInputDefinition,
  TaskOutputDefinition,
} from "@ellmers/task-graph";

/**
 * Type definitions for LambdaTask input and output
 * These types are generated from the static input/output definitions
 */
export type LambdaTaskInput = {
  fn: (param: {
    input: TaskInput;
    updateProgress: (progress: number, message: string) => void;
  }) => Promise<LambdaTaskOutput>;
  name?: string;
  input?: TaskInput;
};
export type LambdaTaskOutput = {
  output: any;
};

/**
 * LambdaTask provides a way to execute arbitrary functions within the task framework
 * It wraps a provided function and its input into a task that can be integrated
 * into task graphs and workflows
 */
export class LambdaTask extends SingleTask {
  static readonly type = "LambdaTask";
  declare runInputData: LambdaTaskInput;
  declare defaults: Partial<LambdaTaskInput>;
  declare runOutputData: TaskOutput;

  /**
   * Input definition for LambdaTask
   * - fn: The function to execute
   * - input: Optional input data to pass to the function
   */
  public static inputs: TaskInputDefinition[] = [
    {
      id: "fn",
      name: "Function",
      valueType: "function", // Expects a callable function
    },
    {
      id: "input",
      name: "Input",
      valueType: "any", // Can accept any type of input
    },
    {
      id: "name",
      name: "Name",
      valueType: "string",
      defaultValue: "Lambda fn",
      optional: true,
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

  constructor(config: TaskConfig & { input?: LambdaTaskInput } = {}) {
    config.name = config.input?.name || config.name || "Lambda";
    super(config);
  }

  /**
   * Executes the provided function with the given input
   * Throws an error if no function is provided or if the provided value is not callable
   */
  async runReactive() {
    if (!this.runInputData.fn) {
      throw new Error("No runner provided");
    }
    if (typeof this.runInputData.fn === "function") {
      const updateProgress = (progress: number, message: string) => {
        this.handleProgress(progress, message);
      };
      const result = await this.runInputData.fn({
        input: this.runInputData.input ?? {},
        updateProgress,
      });
      this.runOutputData.output = result.output;
    } else {
      console.error("error", "Runner is not a function");
    }
    return this.runOutputData;
  }

  public resetInputData(): void {
    // Use deep clone to avoid state leakage
    const { fn, ...rest } = this.defaults;
    // @ts-ignore
    this.defaults = rest;
    super.resetInputData();
    this.defaults.fn = fn;
    this.runInputData.fn = fn!;
  }
}

// Register LambdaTask with the task registry
TaskRegistry.registerTask(LambdaTask);

/**
 * Helper function to create and configure a LambdaTask instance
 */
const LambdaBuilder = (input: LambdaTaskInput) => {
  return new LambdaTask({ input });
};

/**
 * Convenience function to create and run a LambdaTask
 */
export const Lambda = (input: LambdaTaskInput) => {
  return LambdaBuilder(input).run();
};

// Add Lambda task builder to TaskGraphBuilder interface
declare module "@ellmers/task-graph" {
  interface TaskGraphBuilder {
    Lambda: TaskGraphBuilderHelper<LambdaTaskInput>;
  }
}

TaskGraphBuilder.prototype.Lambda = TaskGraphBuilderHelper(LambdaTask);
