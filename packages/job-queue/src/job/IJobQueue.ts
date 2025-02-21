//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ILimiter } from "./ILimiter";
import { Job, JobStatus } from "./Job";
import { JobQueueStats } from "./JobQueue";
import { JobProgressListener } from "./JobQueueEventListeners";
import { JobError } from "./JobError";
import { IQueueStorage } from "./IQueueStorage";

/**
 * Common options for all job queues
 */

export interface JobQueueOptions<Input, Output> {
  /**
   * Time in milliseconds after which completed jobs should be deleted
   * Set to 0 to delete immediately, undefined to never delete
   */
  deleteAfterCompletionMs?: number;
  /**
   * Time in milliseconds after which failed jobs should be deleted
   * Set to 0 to delete immediately, undefined to never delete
   */
  deleteAfterFailureMs?: number;
  /**
   * How often to check for new jobs in milliseconds
   */
  waitDurationInMilliseconds?: number;
  /**
   * Rate limiter to control job execution
   */
  limiter?: ILimiter;

  /**
   * Storage to use for the job queue
   */
  storage?: IQueueStorage<Input, Output>;
} /**
 * Defines how a job queue operates in different contexts
 */

export enum QueueMode {
  /**
   * Queue operates in client mode only - can submit jobs and receive progress updates
   * but does not process jobs
   */
  CLIENT = "CLIENT",

  /**
   * Queue operates in server mode only - processes jobs but does not accept new submissions
   */
  SERVER = "SERVER",

  /**
   * Queue operates in both client and server mode - can submit and process jobs
   */
  BOTH = "BOTH",
}

/**
 * Interface for a job queue
 */
export interface IJobQueue<Input, Output> {
  /**
   * The name of the queue
   */
  queueName: string;

  /**
   * Add a job to the queue
   * @param job The job to add
   * @returns A promise that resolves to the job ID
   */
  add(job: Job<Input, Output>): Promise<unknown>;

  /**
   * Get a job by its ID
   * @param id The job ID
   * @returns A promise that resolves to the job, or undefined if not found
   */
  get(id: unknown): Promise<Job<Input, Output> | undefined>;

  /**
   * Wait for a job to complete
   * @param jobId The job ID to wait for
   * @returns A promise that resolves to the job output, or rejects with an error
   */
  waitFor(jobId: unknown): Promise<Output>;

  /**
   * Abort a job
   * @param jobId The job ID to abort
   * @returns A promise that resolves to true if the job was aborted, false otherwise
   */
  abort(jobId: unknown): Promise<boolean>;

  /**
   * Peek at jobs in the queue
   * @param status Optional status to filter by
   * @param num Optional number of jobs to return
   * @returns A promise that resolves to an array of jobs
   */
  peek(status?: JobStatus, num?: number): Promise<Job<Input, Output>[]>;

  /**
   * Get the size of the queue
   * @param status Optional status to filter by
   * @returns A promise that resolves to the number of jobs
   */
  size(status?: JobStatus): Promise<number>;

  /**
   * Complete a job
   * @param id The job ID
   * @param output Optional output to set
   * @param error Optional error to set
   * @returns A promise that resolves when the job is completed
   * @note If deleteCompletedJobs option is enabled, the job will be deleted after completion
   */
  complete(id: unknown, output?: Output, error?: JobError): Promise<void>;

  /**
   * Get the output for a job by its input
   * @param input The job input
   * @returns A promise that resolves to the job output, or null if not found
   */
  outputForInput(input: Input): Promise<Output | null>;

  /**
   * Get jobs by their run ID
   * @param jobRunId The job run ID
   * @returns A promise that resolves to an array of jobs
   */
  getJobsByRunId(jobRunId: string): Promise<Job<Input, Output>[]>;

  /**
   * Get the stats for the job queue
   * @returns The job queue stats
   */
  getStats(): JobQueueStats;

  /**
   * Update the progress of a job
   * @param jobId The job ID
   * @param progress The progress value
   * @param message Optional message to set
   * @param details Optional details to set
   * @returns A promise that resolves when the progress is updated
   */
  updateProgress(
    jobId: unknown,
    progress: number,
    message?: string,
    details?: Record<string, any> | null
  ): Promise<void>;
  onJobProgress(jobId: unknown, listener: JobProgressListener): () => void;
  removeAllJobProgressListeners(jobId: unknown): void;

  /**
   * Start the job queue
   * @param mode Optional mode to set
   * @returns A promise that resolves to the job queue
   */
  start(mode?: QueueMode): Promise<this>;

  /**
   * Stop the job queue
   * @returns A promise that resolves to the job queue
   */
  stop(): Promise<this>;

  /**
   * Clear the job queue
   * @returns A promise that resolves to the job queue
   */
  clear(): Promise<this>;

  /**
   * Restart the job queue
   * @returns A promise that resolves to the job queue
   */
  restart(): Promise<this>;

  /**
   * Get the next job from the queue
   * @returns A promise that resolves to the next job, or undefined if the queue is empty
   */
  next(): Promise<Job<Input, Output> | undefined>;
}
