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
  run?: (
    input: TaskInput,
    updateProgress: (progress: number, message: string) => void
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
    if (config.input?.run || config.input?.runReactive) {
      config.run = config.input.run;
      delete config.input.run;
      config.runReactive = config.input.runReactive;
      delete config.input.runReactive;
      config.input = config.input.input;
      delete config?.input?.input;
    }
    super(config);
  }

  resetInputData() {
    if (this.runInputData?.run || this.runInputData?.runReactive) {
      this.config.run = this.runInputData.run;
      delete this.runInputData.run;
      this.config.runReactive = this.runInputData.runReactive;
      delete this.runInputData.runReactive;
      this.runInputData = this.runInputData.input;
      delete this.runInputData?.input;
    }
    super.resetInputData();
  }

  /**
   * Default implementation of run that just returns the current output data.
   * Subclasses should override this to provide actual task functionality.
   */
  async run(): Promise<TaskOutput> {
    this.handleStart();

    try {
      if (!(await this.validateInputData(this.runInputData))) {
        throw new Error("Invalid input data");
      }
      if (this.status === TaskStatus.ABORTING) {
        throw new Error("Task aborted by run time");
      }
      if (typeof this.config.run === "function") {
        let updateProgress = (progress: number, message: string) => {
          this.handleProgress(progress, message);
        };
        this.runOutputData = await this.config.run(this.runInputData ?? {}, updateProgress);
      }
      this.runOutputData = await this.runReactive();

      this.handleComplete();
      return this.runOutputData;
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
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
