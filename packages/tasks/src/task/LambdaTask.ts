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
  IConfig,
} from "@ellmers/task-graph";

type LambdaTaskConfig = Partial<IConfig> & {
  fn: (
    input: TaskInput,
    updateProgress: (progress: number, message: string) => void
  ) => Promise<TaskOutput>;
  input?: TaskInput;
};
/**
 * LambdaTask provides a way to execute arbitrary functions within the task framework
 * It wraps a provided function and its input into a task that can be integrated
 * into task graphs and workflows
 */
export class LambdaTask extends SingleTask {
  static readonly type = "LambdaTask";
  declare runInputData: TaskInput;
  declare defaults: Partial<TaskInput>;
  declare runOutputData: TaskOutput;
  declare config: LambdaTaskConfig & IConfig;

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

  constructor(config: LambdaTaskConfig) {
    if (config.input?.fn) {
      config.fn = config.input.fn;
      delete config.input.fn;
      config.input = config.input.input;
      delete config?.input?.input;
    }
    super(config);
  }

  /**
   * Executes the provided function with the given input
   * Throws an error if no function is provided or if the provided value is not callable
   */
  async runReactive() {
    if (!this.config.fn) {
      throw new Error("No runner provided");
    }
    if (typeof this.config.fn === "function") {
      const updateProgress = (progress: number, message: string) => {
        this.handleProgress(progress, message);
      };
      const result = await this.config.fn(this.runInputData ?? {}, updateProgress);
      this.runOutputData = result;
    } else {
      console.error("error", "Runner is not a function");
    }
    return this.runOutputData;
  }
}

// Register LambdaTask with the task registry
TaskRegistry.registerTask(LambdaTask);

/**
 * Convenience function to create and run a LambdaTask
 */
export const Lambda = (config: LambdaTaskConfig) => {
  const task = new LambdaTask(config);
  return task.run();
};

// Add Lambda task builder to TaskGraphBuilder interface
declare module "@ellmers/task-graph" {
  interface TaskGraphBuilder {
    Lambda: TaskGraphBuilderHelper<LambdaTaskConfig>;
  }
}

TaskGraphBuilder.prototype.Lambda = TaskGraphBuilderHelper(LambdaTask);
