//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

export abstract class JobError extends Error {
  public abstract retryable: boolean;
}
/**
 * A job error that is retryable
 *
 * Examples: network timeouts, temporary unavailability of an external service, or rate-limiting
 */

export class RetryableJobError extends JobError {
  constructor(
    message: string,
    public retryDate: Date
  ) {
    super(message);
    this.name = "RetryableJobError";
  }
  public retryable = true;
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
    this.name = "PermanentJobError";
  }
  public retryable = false;
}
/**
 *
 */

export class AbortSignalJobError extends PermanentJobError {
  constructor(message: string) {
    super(message);
    this.name = "AbortSignalJobError";
  }
}
