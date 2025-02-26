//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

export class JobError extends Error {
  public retryable = false;
  public name: string;
  constructor(public message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * A job error that is caused by a job not being found
 *
 * Examples: job.id is undefined, job.id is not found in the storage, etc.
 */
export class JobNotFoundError extends JobError {
  constructor(message: string = "Job not found") {
    super(message);
  }
}

/**
 * A job error that is retryable
 *
 * Examples: network timeouts, temporary unavailability of an external service, or rate-limiting
 */

export class RetryableJobError extends JobError {
  constructor(
    message: string,
    public retryDate?: Date
  ) {
    super(message);
    this.retryable = true;
  }
}

/**
 * A job error that is not retryable
 *
 * Examples: invalid input, missing required parameters, or a permanent failure of
 * an external service, permission errors, running out of money for an API, etc.
 */
export class PermanentJobError extends JobError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * A job error that is caused by an abort signal,
 * meaning the client aborted the job on purpose,
 * not by the queue going down or similar.
 *
 * Example: job.abort()
 */
export class AbortSignalJobError extends PermanentJobError {
  constructor(message: string) {
    super(message);
  }
}
