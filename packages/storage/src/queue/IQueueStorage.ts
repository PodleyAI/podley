//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

export enum JobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ABORTING = "ABORTING",
  FAILED = "FAILED",
}

/**
 * Details about a job that reflect the structure in the database.
 */
export type JobStorageFormat<Input, Output> = {
  id?: unknown;
  jobRunId?: string;
  queue?: string;
  input: Input;
  output?: Output | null;
  error?: string | null;
  errorCode?: string | null;
  fingerprint?: string;
  maxRetries?: number;
  status?: JobStatus;
  createdAt?: string;
  deadlineAt?: string | null;
  lastRanAt?: string | null;
  runAfter: string | null;
  completedAt: string | null;
  runAttempts?: number;
  progress?: number;
  progressMessage?: string;
  progressDetails?: Record<string, any> | null;
};

/**
 * Interface defining the storage operations for a job queue
 */
export interface IQueueStorage<Input, Output> {
  /**
   * Adds a job to the queue storage
   * @param job - The job to add to the queue storage
   * @returns The ID of the job
   */
  add(job: JobStorageFormat<Input, Output>): Promise<unknown>;

  /**
   * Gets a job from the queue storage by ID
   * @param id - The ID of the job to get
   * @returns The job with the given ID
   */
  get(id: unknown): Promise<JobStorageFormat<Input, Output> | undefined>;

  /**
   * Gets the next job from the queue storage
   * @returns The next job from the queue storage
   */
  next(): Promise<JobStorageFormat<Input, Output> | undefined>;

  /**
   * Peeks at the next job(s) from the queue storage without removing them
   * @param status - The status of the jobs to peek at
   * @param num - The number of jobs to peek at
   * @returns The jobs with the given status
   */
  peek(status?: JobStatus, num?: number): Promise<Array<JobStorageFormat<Input, Output>>>;

  /**
   * Gets the size of the queue storage
   * @param status - The status of the jobs to get the size for
   * @returns The size of the queue storage
   */
  size(status?: JobStatus): Promise<number>;

  /**
   * Completes a job in the queue storage
   * @param job - The job to complete
   */
  complete(job: JobStorageFormat<Input, Output>): Promise<void>;

  /**
   * Deletes all jobs from the queue storage
   */
  deleteAll(): Promise<void>;

  /**
   * Gets the output for a given input from the queue storage
   * @param input - The input to get the output for
   * @returns The output of the job
   */
  outputForInput(input: Input): Promise<Output | null>;

  /**
   * Aborts a job in the queue storage
   * @param id - The ID of the job to abort
   */
  abort(id: unknown): Promise<void>;

  /**
   * Gets the jobs by job run ID from the queue storage
   * @param runId - The job run ID of the jobs to get
   * @returns The jobs with the given job run ID
   */
  getByRunId(runId: string): Promise<Array<JobStorageFormat<Input, Output>>>;

  /**
   * Saves progress updates for a job in the queue storage
   * @param id - The ID of the job to save the progress for
   * @param progress - The progress of the job
   * @param message - The message of the job
   * @param details - The details of the job
   */
  saveProgress(
    id: unknown,
    progress: number,
    message: string,
    details: Record<string, any> | null
  ): Promise<void>;

  /**
   * Deletes a job by its ID from the queue storage
   * @param id - The ID of the job to delete
   */
  delete(id: unknown): Promise<void>;

  /**
   * Deletes jobs from the queue storage that are of a specific status and older than the specified time
   * @param status - The status of the jobs to delete
   * @param olderThanMs - The time in milliseconds that the jobs must be older than to be deleted
   */
  deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void>;
}
