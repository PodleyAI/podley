/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, makeFingerprint, sleep, uuid4 } from "@workglow/util";
import { IQueueStorage, JobStatus, JobStorageFormat, QueueStorageOptions } from "./IQueueStorage";

export const IN_MEMORY_QUEUE_STORAGE = createServiceToken<IQueueStorage<any, any>>(
  "jobqueue.storage.inMemory"
);

/**
 * In-memory implementation of a job queue that manages asynchronous tasks.
 * Supports job scheduling, status tracking, result caching, and prefix-based filtering.
 */
export class InMemoryQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  /** The prefix values for filtering jobs */
  protected readonly prefixValues: Readonly<Record<string, string | number>>;

  /**
   * Creates a new in-memory job queue
   * @param queueName - Name of the queue
   * @param options - Optional configuration including prefix filters
   */
  constructor(
    public readonly queueName: string,
    options?: QueueStorageOptions
  ) {
    this.jobQueue = [];
    this.prefixValues = options?.prefixValues ?? {};
  }

  /** Internal array storing all jobs */
  public jobQueue: Array<JobStorageFormat<Input, Output> & Record<string, unknown>>;

  /**
   * Checks if a job matches the current prefix values
   */
  private matchesPrefixes(job: JobStorageFormat<Input, Output> & Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(this.prefixValues)) {
      if (job[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a filtered and sorted list of pending jobs that are ready to run
   * Sorts by creation time to maintain FIFO order
   */
  private pendingQueue(): Array<JobStorageFormat<Input, Output> & Record<string, unknown>> {
    const now = new Date().toISOString();
    return this.jobQueue
      .filter((job) => this.matchesPrefixes(job))
      .filter((job) => job.status === JobStatus.PENDING)
      .filter((job) => !job.run_after || job.run_after <= now)
      .sort((a, b) => (a.run_after || "").localeCompare(b.run_after || ""));
  }

  /**
   * Adds a new job to the queue
   * Generates an ID and fingerprint if not provided
   */
  public async add(job: JobStorageFormat<Input, Output>): Promise<unknown> {
    await sleep(0);
    const now = new Date().toISOString();
    const jobWithPrefixes = job as JobStorageFormat<Input, Output> & Record<string, unknown>;
    jobWithPrefixes.id = jobWithPrefixes.id ?? uuid4();
    jobWithPrefixes.job_run_id = jobWithPrefixes.job_run_id ?? uuid4();
    jobWithPrefixes.queue = this.queueName;
    jobWithPrefixes.fingerprint = await makeFingerprint(jobWithPrefixes.input);
    jobWithPrefixes.status = JobStatus.PENDING;
    jobWithPrefixes.progress = 0;
    jobWithPrefixes.progress_message = "";
    jobWithPrefixes.progress_details = null;
    jobWithPrefixes.created_at = now;
    jobWithPrefixes.run_after = now;

    // Add prefix values to the job
    for (const [key, value] of Object.entries(this.prefixValues)) {
      jobWithPrefixes[key] = value;
    }

    this.jobQueue.push(jobWithPrefixes);
    return jobWithPrefixes.id;
  }

  /**
   * Retrieves a job from the queue by its id.
   * @param id - The id of the job to retrieve.
   * @returns A promise that resolves to the job or undefined if the job is not found.
   */
  public async get(id: unknown): Promise<JobStorageFormat<Input, Output> | undefined> {
    await sleep(0);
    const job = this.jobQueue.find((j) => j.id === id);
    if (job && this.matchesPrefixes(job)) {
      return job;
    }
    return undefined;
  }

  /**
   * Retrieves a slice of jobs from the queue.
   * @param status - The status of the jobs to retrieve.
   * @param num - The number of jobs to retrieve.
   * @returns A promise that resolves to an array of jobs.
   */
  public async peek(
    status: JobStatus = JobStatus.PENDING,
    num: number = 100
  ): Promise<Array<JobStorageFormat<Input, Output>>> {
    await sleep(0);
    num = Number(num) || 100;
    return this.jobQueue
      .filter((j) => this.matchesPrefixes(j))
      .sort((a, b) => (a.run_after || "").localeCompare(b.run_after || ""))
      .filter((j) => j.status === status)
      .slice(0, num);
  }

  /**
   * Retrieves the next available job that is ready to be processed
   * Updates the job status to PROCESSING before returning
   */
  public async next() {
    await sleep(0);
    const top = this.pendingQueue();

    const job = top[0];
    if (job) {
      job.status = JobStatus.PROCESSING;
      job.last_ran_at = new Date().toISOString();
      return job;
    }
  }

  /**
   * Retrieves the size of the queue for a given status
   * @param status - The status of the jobs to retrieve.
   * @returns A promise that resolves to the number of jobs.
   */
  public async size(status = JobStatus.PENDING): Promise<number> {
    await sleep(0);
    return this.jobQueue.filter((j) => this.matchesPrefixes(j) && j.status === status).length;
  }

  /**
   * Saves the progress of a job
   * @param jobId - The id of the job to save the progress for.
   * @param progress - The progress of the job.
   * @param message - The message of the job.
   * @param details - The details of the job.
   */
  public async saveProgress(
    id: unknown,
    progress: number,
    message: string,
    details: Record<string, any> | null
  ): Promise<void> {
    await sleep(0);
    const job = this.jobQueue.find((j) => j.id === id && this.matchesPrefixes(j));
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }

    job.progress = progress;
    job.progress_message = message;
    job.progress_details = details;
  }

  /**
   * Marks a job as complete with its output or error
   * Handles run_attempts for failed jobs and triggers completion callbacks
   * @param id - ID of the job to complete
   * @param output - Result of the job execution
   * @param error - Optional error message if job failed
   */
  public async complete(job: JobStorageFormat<Input, Output>) {
    await sleep(0);
    const index = this.jobQueue.findIndex((j) => j.id === job.id);
    if (index !== -1) {
      const existing = this.jobQueue[index];
      const currentAttempts = existing?.run_attempts ?? 0;
      job.run_attempts = currentAttempts + 1;
      this.jobQueue[index] = job;
    }
  }

  /**
   * Aborts a job
   * @param id - The id of the job to abort.
   */
  public async abort(id: unknown): Promise<void> {
    await sleep(0);
    const job = this.jobQueue.find((j) => j.id === id && this.matchesPrefixes(j));
    if (job) {
      job.status = JobStatus.ABORTING;
    }
  }

  /**
   * Retrieves all jobs by their job_run_id.
   * @param job_run_id - The job_run_id of the jobs to retrieve.
   * @returns A promise that resolves to an array of jobs.
   */
  public async getByRunId(runId: string): Promise<Array<JobStorageFormat<Input, Output>>> {
    await sleep(0);
    return this.jobQueue.filter((job) => this.matchesPrefixes(job) && job.job_run_id === runId);
  }

  /**
   * Deletes all jobs from the queue that match the current prefix values.
   */
  public async deleteAll(): Promise<void> {
    await sleep(0);
    this.jobQueue = this.jobQueue.filter((job) => !this.matchesPrefixes(job));
  }

  /**
   * Looks up cached output for a given input
   * Uses input fingerprinting for efficient matching
   * @param input - The input to look up the cached output for.
   * @returns The cached output or null if not found
   */
  public async outputForInput(input: Input): Promise<Output | null> {
    await sleep(0);
    const fingerprint = await makeFingerprint(input);
    return (
      this.jobQueue.find(
        (j) =>
          this.matchesPrefixes(j) &&
          j.fingerprint === fingerprint &&
          j.status === JobStatus.COMPLETED
      )?.output ?? null
    );
  }

  /**
   * Deletes a job by its ID
   */
  public async delete(id: unknown): Promise<void> {
    await sleep(0);
    this.jobQueue = this.jobQueue.filter((job) => !(job.id === id && this.matchesPrefixes(job)));
  }

  /**
   * Delete jobs with a specific status older than a cutoff date
   * @param status - Status of jobs to delete
   * @param olderThanMs - Delete jobs completed more than this many milliseconds ago
   */
  public async deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void> {
    await sleep(0);
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();
    this.jobQueue = this.jobQueue.filter(
      (job) =>
        !this.matchesPrefixes(job) ||
        job.status !== status ||
        !job.completed_at ||
        job.completed_at > cutoffDate
    );
  }

  /**
   * Sets up the database schema and tables.
   * No-op for in-memory storage as it doesn't require database setup.
   */
  public async setupDatabase(): Promise<void> {
    // No-op for in-memory storage
  }
}
