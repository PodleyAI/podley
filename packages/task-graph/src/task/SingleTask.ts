//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { ISimpleTask } from "./ITask";
import type { TaskOutput, TaskTypeName, TaskConfig, TaskInput } from "./TaskTypes";
import { TaskBase } from "./TaskBase";

/**
 * Represents a single task, which is a basic unit of work in the task graph.
 * This is the base class for all simple (non-compound) tasks.
 *
 * SingleTask implements the ISimpleTask interface and provides a foundation
 * for creating concrete task implementations that perform specific operations.
 */
export class SingleTask<
    Input extends TaskInput = TaskInput,
    Output extends TaskOutput = TaskOutput,
    Config extends TaskConfig = TaskConfig,
  >
  extends TaskBase<Input, Output, Config>
  implements ISimpleTask<Input, Output, Config>
{
  /**
   * The type identifier for this task class
   */
  static readonly type: TaskTypeName = "SingleTask";

  /**
   * Indicates that this is not a compound task (does not contain subtasks)
   */
  readonly isCompound = false;

  /**
   * Default implementation of runFull that just returns the current output data.
   * Subclasses should override this to provide actual task functionality.
   *
   * @returns The task output
   */
  public async runFull(): Promise<Output> {
    return this.runReactive();
  }

  /**
   * Default implementation of runReactive that just returns the current output data.
   * Subclasses should override this to provide actual reactive functionality.
   *
   * This is generally for UI updating, and should be lightweight.
   *
   * @returns The task output
   */
  public async runReactive(): Promise<Output> {
    this.runOutputData ??= {} as Output;
    return this.runOutputData;
  }
}
