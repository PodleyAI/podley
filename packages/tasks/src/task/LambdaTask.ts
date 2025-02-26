//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  SingleTask,
  TaskOutput,
  TaskGraphBuilder,
  TaskGraphBuilderHelper,
  TaskRegistry,
  TaskInput,
  TaskInputDefinition,
  TaskOutputDefinition,
  IConfig,
  TaskStatus,
} from "@ellmers/task-graph";

type LambdaTaskConfig = Partial<IConfig> & {
  runFull?: (
    input: TaskInput,
    updateProgress: (progress: number, message: string) => void,
    signal?: AbortSignal
  ) => Promise<TaskOutput>;
  runReactive?: (input: TaskInput) => Promise<TaskOutput>;
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
    if (config.input?.runFull || config.input?.runReactive) {
      if (config.input.runFull) {
        config.runFull = config.input.runFull;
        delete config.input.runFull;
      }
      if (config.input.runReactive) {
        config.runReactive = config.input.runReactive;
        delete config.input.runReactive;
      }
      config.input = config.input.input;
      delete config?.input?.input;
    }
    super(config);
  }

  resetInputData() {
    if (this.runInputData?.runFull || this.runInputData?.runReactive) {
      if (this.runInputData.runFull) {
        this.config.runFull = this.runInputData.runFull;
        delete this.runInputData.runFull;
      }
      if (this.runInputData.runReactive) {
        this.config.runReactive = this.runInputData.runReactive;
        delete this.runInputData.runReactive;
      }
      this.runInputData = this.runInputData.input;
      delete this.runInputData?.input;
    }
    super.resetInputData();
  }

  async runFull(): Promise<TaskOutput> {
    let updateProgress = (progress: number, message: string) => {
      this.handleProgress(progress, message);
    };
    if (typeof this.config.runFull === "function") {
      this.runOutputData = await this.config.runFull(
        this.runInputData ?? {},
        updateProgress,
        this.abortController?.signal
      );
    }
    this.runOutputData = await this.runReactive();
    return this.runOutputData;
  }

  /**
   * Executes the provided function with the given input
   * Throws an error if no function is provided or if the provided value is not callable
   */
  async runReactive() {
    if (typeof this.config.runReactive === "function") {
      const result = await this.config.runReactive(this.runInputData ?? {});
      this.runOutputData = result;
    }
    return super.runReactive();
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
