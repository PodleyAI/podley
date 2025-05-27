//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { JobError } from "@podley/job-queue";
import { BaseError } from "@podley/util";

export class TaskError extends BaseError {
  static readonly type: string = "TaskError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * A task configuration error
 *
 */
export class TaskConfigurationError extends TaskError {
  static readonly type: string = "TaskConfigurationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * A task workflow error
 */
export class WorkflowError extends TaskError {
  static readonly type: string = "WorkflowError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * A task error that is caused by a task being aborted
 *
 * Examples: task.abort() was called, or some other reason an abort signal was received
 */
export class TaskAbortedError extends TaskError {
  static readonly type: string = "TaskAbortedError";
  constructor(message: string = "Task aborted") {
    super(message);
  }
}

/**
 * A task error that is caused by a task failing
 *
 * Examples: task.run() threw an error
 */
export class TaskFailedError extends TaskError {
  static readonly type: string = "TaskFailedError";
  constructor(message: string = "Task failed") {
    super(message);
  }
}

export class JobTaskFailedError extends TaskFailedError {
  static readonly type: string = "JobTaskFailedError";
  public jobError: JobError;
  constructor(err: JobError) {
    super(String(err));
    this.jobError = err;
  }
}

/**
 * A task error that is caused by an error converting JSON to a Task
 */
export class TaskJSONError extends TaskError {
  static readonly type: string = "TaskJSONError";
  constructor(message: string = "Error converting JSON to a Task") {
    super(message);
  }
}

/**
 * A task error that is caused by invalid input data
 *
 * Examples: task.run() received invalid input data
 */
export class TaskInvalidInputError extends TaskError {
  static readonly type: string = "TaskInvalidInputError";
  constructor(message: string = "Invalid input data") {
    super(message);
  }
}
