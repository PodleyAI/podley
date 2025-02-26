//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

export class TaskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * A task configuration error
 *
 */
export class TaskConfigurationError extends TaskError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * A task builder error
 */
export class TaskBuilderError extends TaskError {
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
  constructor(message: string = "Task failed") {
    super(message);
  }
}

/**
 * A task error that is caused by invalid input data
 *
 * Examples: task.run() received invalid input data
 */
export class TaskInvalidInputError extends TaskError {
  constructor(message: string = "Invalid input data") {
    super(message);
  }
}

/**
 * Compound tasks can have multiple errors, and this error is used to group them together.
 *
 * Examples: CompoundTask, ArrayTask, TaskRunner, etc.
 */
export class TaskErrorGroup extends TaskError {
  constructor(private errors: [key: unknown, error: TaskError][]) {
    super("Multiple errors occurred");
  }
  getError(key: unknown): TaskError | undefined {
    return this.errors.find(([k]) => k === key)?.[1];
  }
  getErrors(): TaskError[] {
    return this.errors.map(([k, error]) => error);
  }
  getErrorKeys(): unknown[] {
    return this.errors.map(([k]) => k);
  }
  getErrorEntries(): [key: unknown, error: TaskError][] {
    return this.errors;
  }
  getErrorCount(): number {
    return this.errors.length;
  }
  getErrorNames(): string[] {
    return this.errors.map(([k, error]) => error.name);
  }
  getErrorMessages(): string[] {
    return this.errors.map(([k, error]) => error.message);
  }
  getFirstError(): TaskError {
    return this.errors[0][1];
  }
  getFirstErrorKey(): unknown {
    return this.errors[0][0];
  }
  hasAbortError(): boolean {
    return this.errors.some(([k, error]) => error instanceof TaskAbortedError);
  }
}
