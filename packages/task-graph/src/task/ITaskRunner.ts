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
  SingleOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  FinalOutput extends TaskOutput = SingleOutput,
> {
  /**
   * The task being run
   */
  readonly task: ITask<Input, SingleOutput, Config, FinalOutput>;

  /**
   * Runs the task with the provided input overrides
   * @param overrides Optional input overrides
   */
  run(overrides?: Partial<Input>): Promise<FinalOutput>;

  /**
   * Runs the task in reactive mode
   * @param overrides Optional input overrides
   */
  runReactive(overrides?: Partial<Input>): Promise<FinalOutput>;

  /**
   * Aborts the task execution
   */
  abort(): void;
}
