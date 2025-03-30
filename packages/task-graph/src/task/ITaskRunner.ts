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
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> {
  /**
   * The task being run
   */
  readonly task: ITask<Input, Output, Config>;

  /**
   * Runs the task with the provided input overrides
   * @param overrides Optional input overrides
   */
  run(overrides?: Partial<Input>): Promise<Output>;

  /**
   * Runs the task in reactive mode
   * @param overrides Optional input overrides
   */
  runReactive(overrides?: Partial<Input>): Promise<Output>;

  /**
   * Aborts the task execution
   */
  abort(): void;

  /**
   * Skips the task execution
   */
  skip(): Promise<void>;
}
