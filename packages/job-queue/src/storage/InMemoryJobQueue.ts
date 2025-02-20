//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { nanoid } from "nanoid";
import { makeFingerprint, sleep } from "@ellmers/util";
import { JobError, JobQueue, PermanentJobError, RetryableJobError } from "../job/JobQueue";
import { JobQueueOptions } from "job/IJobQueue";
import { Job, JobStatus } from "../job/Job";
/**
 * In-memory implementation of a job queue that manages asynchronous tasks.
 * Supports job scheduling, status tracking, and result caching.
 */
export class InMemoryJobQueue<Input, Output> extends JobQueue<Input, Output> {
  /**
   * Creates a new in-memory job queue
   * @param queue - Name of the queue
   * @param jobClass - Optional custom Job class implementation
   * @param options - Queue configuration options including limiter
   */
  constructor(
    queue: string,
    jobClass: typeof Job<Input, Output> = Job<Input, Output>,
    options: JobQueueOptions
  ) {
    super(queue, jobClass, options);
    this.jobQueue = [];
  }

  /** Internal array storing all jobs */
  private jobQueue: Job<Input, Output>[];

  /**
   * Returns a filtered and sorted list of pending jobs that are ready to run
   * Sorts by creation time to maintain FIFO order
   */
  private pendingQueue() {
    return this.jobQueue
      .filter((job) => job.status === JobStatus.PENDING)
      .filter((job) => job.runAfter.getTime() <= Date.now())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Adds a new job to the queue
   * Generates an ID and fingerprint if not provided
   */
  public async add(job: Job<Input, Output>) {
    await sleep(0);
    job.id = job.id ?? nanoid();
    job.jobRunId = job.jobRunId ?? nanoid();
    job.queueName = this.queueName;
    job.fingerprint = await makeFingerprint(job.input);
    job.status = JobStatus.PENDING;
    job.progress = 0;
    job.progressMessage = "";
    job.progressDetails = null;
    job.queue = this;

    this.jobQueue.push(job);
    return job.id;
  }

  /**
   * Retrieves a job from the queue by its id.
   * @param id - The id of the job to retrieve.
   * @returns A promise that resolves to the job or undefined if the job is not found.
   */
  public async get(id: unknown) {
    await sleep(0);
    const result = this.jobQueue.find((j) => j.id === id);
    return result ? this.createNewJob(result, false) : undefined;
  }

  /**
   * Retrieves a slice of jobs from the queue.
   * @param status - The status of the jobs to retrieve.
   * @param num - The number of jobs to retrieve.
   * @returns A promise that resolves to an array of jobs.
   */
  public async peek(status: JobStatus = JobStatus.PENDING, num: number = 100) {
    await sleep(0);
    num = Number(num) || 100;
    return this.jobQueue
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .filter((j) => j.status === status)
      .slice(0, num)
      .map((j) => this.createNewJob(j, false));
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
      return this.createNewJob(job, false);
    }
  }

  /**
   * Retrieves the size of the queue for a given status
   * @param status - The status of the jobs to retrieve.
   * @returns A promise that resolves to the number of jobs.
   */
  public async size(status = JobStatus.PENDING): Promise<number> {
    await sleep(0);
    return this.jobQueue.filter((j) => j.status === status && j.runAfter.getTime() <= Date.now())
      .length;
  }

  /**
   * Saves the progress of a job
   * @param jobId - The id of the job to save the progress for.
   * @param progress - The progress of the job.
   * @param message - The message of the job.
   * @param details - The details of the job.
   */
  protected async saveProgress(
    jobId: unknown,
    progress: number,
    message: string,
    details: Record<string, any> | null
  ): Promise<void> {
    const job = this.jobQueue.find((j) => j.id === jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.progress = progress;
    job.progressMessage = message;
    job.progressDetails = details;
    await sleep(0);
  }

  /**
   * Marks a job as complete with its output or error
   * Handles retries for failed jobs and triggers completion callbacks
   * @param id - ID of the job to complete
   * @param output - Result of the job execution
   * @param error - Optional error message if job failed
   */
  public async complete(id: unknown, output: Output, error?: JobError) {
    await sleep(0); // ensure does not run straight through and thus act like the others
    const job = this.jobQueue.find((j) => j.id === id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }

    job.progress = 100;
    job.progressMessage = "";
    job.progressDetails = null;

    if (error) {
      job.error = error.message;
      job.errorCode = error.name;
      if (error instanceof RetryableJobError) {
        job.retries++;
        if (job.retries >= job.maxRetries) {
          job.status = JobStatus.FAILED;
          job.completedAt = new Date();
        } else {
          job.status = JobStatus.PENDING;
          job.runAfter = error.retryDate;
          job.progress = 0;
        }
      } else if (error instanceof PermanentJobError) {
        job.status = JobStatus.FAILED;
        job.completedAt = new Date();
      } else {
        job.status = JobStatus.FAILED;
        job.completedAt = new Date();
      }
    } else {
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.output = output;
      job.error = null;
      job.errorCode = null;
    }

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      await this.onCompleted(job.id, job.status, output, error);
    }
  }

  /**
   * Aborts a job
   * @param jobId - The id of the job to abort.
   */
  public async abort(jobId: unknown) {
    await sleep(0);
    const job = this.jobQueue.find((j) => j.id === jobId);
    if (job) {
      job.status = JobStatus.ABORTING;
    }
    this.abortJob(jobId);
    return job ? true : false;
  }

  /**
   * Retrieves all jobs by their jobRunId.
   * @param jobRunId - The jobRunId of the jobs to retrieve.
   * @returns A promise that resolves to an array of jobs.
   */
  public async getJobsByRunId(jobRunId: string): Promise<Array<Job<Input, Output>>> {
    await sleep(0);
    return this.jobQueue
      .filter((job) => job.jobRunId === jobRunId)
      .map((j) => this.createNewJob(j, false));
  }

  /**
   * Deletes all jobs from the queue.
   */
  public async deleteAll() {
    await sleep(0);
    this.jobQueue = [];
  }

  /**
   * Looks up cached output for a given and input
   * Uses input fingerprinting for efficient matching
   * @param input - The input to look up the cached output for.
   * @returns The cached output or null if not found
   */
  public async outputForInput(input: Input) {
    await sleep(0);
    const fingerprint = await makeFingerprint(input);
    return (
      this.jobQueue.find((j) => j.fingerprint === fingerprint && j.status === JobStatus.COMPLETED)
        ?.output ?? null
    );
  }

  protected async deleteJob(jobId: unknown): Promise<void> {
    await sleep(0);
    const jobIndex = this.jobQueue.findIndex((job) => job.id === jobId);
    if (jobIndex !== -1) {
      this.jobQueue.splice(jobIndex, 1);
    }
  }
}
