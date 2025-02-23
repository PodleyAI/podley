//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { nanoid } from "nanoid";
import { makeFingerprint } from "@ellmers/util";
import { JobStatus, JobStorageFormat, IQueueStorage } from "./IQueueStorage";
/**
 * In-memory implementation of a job queue that manages asynchronous tasks.
 * Supports job scheduling, status tracking, and result caching.
 */
export class InMemoryQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  /**
   * Creates a new in-memory job queue
   * @param queue - Name of the queue
   */
  constructor(public readonly queueName: string) {
    this.jobQueue = [];
  }

  /** Internal array storing all jobs */
  public jobQueue: JobStorageFormat<Input, Output>[];

  /**
   * Returns a filtered and sorted list of pending jobs that are ready to run
   * Sorts by creation time to maintain FIFO order
   */
  private pendingQueue() {
    const now = new Date().toISOString();
    return this.jobQueue
      .filter((job) => job.status === JobStatus.PENDING)
      .filter((job) => !job.runAfter || job.runAfter <= now)
      .sort((a, b) => (a.runAfter || "").localeCompare(b.runAfter || ""));
  }

  /**
   * Adds a new job to the queue
   * Generates an ID and fingerprint if not provided
   */
  public async add(job: JobStorageFormat<Input, Output>) {
    const now = new Date().toISOString();
    job.id = job.id ?? nanoid();
    job.jobRunId = job.jobRunId ?? nanoid();
    job.queue = this.queueName;
    job.fingerprint = await makeFingerprint(job.input);
    job.status = JobStatus.PENDING;
    job.progress = 0;
    job.progressMessage = "";
    job.progressDetails = null;
    job.createdAt = now;
    job.runAfter = now;

    this.jobQueue.push(job);
    return job.id;
  }

  /**
   * Retrieves a job from the queue by its id.
   * @param id - The id of the job to retrieve.
   * @returns A promise that resolves to the job or undefined if the job is not found.
   */
  public async get(id: unknown) {
    return this.jobQueue.find((j) => j.id === id);
  }

  /**
   * Retrieves a slice of jobs from anywherethe queue.
   * @param status - The status of the jobs to retrieve.
   * @param num - The number of jobs to retrieve.
   * @returns A promise that resolves to an array of jobs.
   */
  public async peek(status: JobStatus = JobStatus.PENDING, num: number = 100) {
    num = Number(num) || 100;
    return this.jobQueue
      .sort((a, b) => (a.runAfter || "").localeCompare(b.runAfter || ""))
      .filter((j) => j.status === status)
      .slice(0, num);
  }

  /**
   * Retrieves the next available job that is ready to be processed
   * Updates the job status to PROCESSING before returning
   */
  public async next() {
    const top = this.pendingQueue();

    const job = top[0];
    if (job) {
      job.status = JobStatus.PROCESSING;
      job.lastRanAt = new Date().toISOString();
      return job;
    }
  }

  /**
   * Retrieves the size of the queue for a given status
   * @param status - The status of the jobs to retrieve.
   * @returns A promise that resolves to the number of jobs.
   */
  public async size(status = JobStatus.PENDING): Promise<number> {
    const now = new Date().toISOString();
    return this.jobQueue.filter((j) => j.status === status).length;
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
    const job = this.jobQueue.find((j) => j.id === id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }

    job.progress = progress;
    job.progressMessage = message;
    job.progressDetails = details;
  }

  /**
   * Marks a job as complete with its output or error
   * Handles runAttempts for failed jobs and triggers completion callbacks
   * @param id - ID of the job to complete
   * @param output - Result of the job execution
   * @param error - Optional error message if job failed
   */
  public async complete(job: JobStorageFormat<Input, Output>) {
    const index = this.jobQueue.findIndex((j) => j.id === job.id);
    if (index !== -1) {
      this.jobQueue[index] = job;
    }
  }

  /**
   * Aborts a job
   * @param id - The id of the job to abort.
   */
  public async abort(id: unknown) {
    const job = this.jobQueue.find((j) => j.id === id);
    if (job) {
      job.status = JobStatus.ABORTING;
    }
  }

  /**
   * Retrieves all jobs by their jobRunId.
   * @param jobRunId - The jobRunId of the jobs to retrieve.
   * @returns A promise that resolves to an array of jobs.
   */
  public async getByRunId(runId: string): Promise<Array<JobStorageFormat<Input, Output>>> {
    return this.jobQueue.filter((job) => job.jobRunId === runId);
  }

  /**
   * Deletes all jobs from the queue.
   */
  public async deleteAll() {
    this.jobQueue = [];
  }

  /**
   * Looks up cached output for a given and input
   * Uses input fingerprinting for efficient matching
   * @param input - The input to look up the cached output for.
   * @returns The cached output or null if not found
   */
  public async outputForInput(input: Input) {
    const fingerprint = await makeFingerprint(input);
    return (
      this.jobQueue.find((j) => j.fingerprint === fingerprint && j.status === JobStatus.COMPLETED)
        ?.output ?? null
    );
  }

  /**
   * Deletes a job by its ID
   */
  public async delete(id: unknown): Promise<void> {
    this.jobQueue = this.jobQueue.filter((job) => job.id !== id);
  }

  /**
   * Delete jobs with a specific status older than a cutoff date
   * @param status - Status of jobs to delete
   * @param olderThanMs - Delete jobs completed more than this many milliseconds ago
   */
  public async deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();
    this.jobQueue = this.jobQueue.filter(
      (job) => job.status !== status || !job.completedAt || job.completedAt > cutoffDate
    );
  }
}
