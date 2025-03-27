//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { TaskInput, TaskOutput, TaskConfig } from "./TaskTypes";
import type { ITask } from "./ITask";

/**
 * Interface for TaskRunner
 * Responsible for running tasks and managing their execution lifecycle
 */

export interface ITaskRunner<
  ExecuteInput extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunInput extends TaskInput = ExecuteInput,
  RunOutput extends TaskOutput = ExecuteOutput,
> {
  /**
   * The task being run
   */
  readonly task: ITask<ExecuteInput, ExecuteOutput, Config, RunInput, RunOutput>;

  /**
   * Runs the task with the provided input overrides
   * @param overrides Optional input overrides
   */
  run(overrides?: Partial<RunInput>): Promise<RunOutput>;

  /**
   * Runs the task in reactive mode
   * @param overrides Optional input overrides
   */
  runReactive(overrides?: Partial<RunInput>): Promise<RunOutput>;

  /**
   * Aborts the task execution
   */
  abort(): void;
}
