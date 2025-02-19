//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { ISimpleTask } from "./ITask";
import { type TaskOutput, type TaskTypeName, TaskStatus } from "./TaskTypes";
import { TaskBase } from "./TaskBase";

/**
 * Represents a single task, which is a basic unit of work in the task graph.
 * This is the base class for all simple (non-compound) tasks.
 */
export class SingleTask extends TaskBase implements ISimpleTask {
  static readonly type: TaskTypeName = "SingleTask";

  readonly isCompound = false;

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

      this.runOutputData = await this.runReactive();

      this.handleComplete();
      return this.runOutputData;
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Default implementation of runReactive that just returns the current output data.
   * Subclasses should override this to provide actual reactive functionality.
   */
  public async runReactive(): Promise<TaskOutput> {
    this.runOutputData ??= {};
    return this.runOutputData;
  }
}
