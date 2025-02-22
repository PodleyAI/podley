//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IQueueStorage, InMemoryQueueStorage, JobStorageFormat } from "@ellmers/storage";
import { EventEmitter, sleep } from "@ellmers/util";
import { JobQueueOptions, QueueMode } from "./IJobQueue";
import { ILimiter } from "./ILimiter";
import { Job, JobConstructorParam, JobStatus } from "./Job";
import { AbortSignalJobError, JobError, PermanentJobError, RetryableJobError } from "./JobError";
import {
  JobProgressListener,
  JobQueueEventListener,
  JobQueueEventListeners,
  JobQueueEventParameters,
  JobQueueEvents,
} from "./JobQueueEventListeners";
import { NullLimiter } from "./NullLimiter";

/**
 * Statistics tracked for the job queue
 */
export interface JobQueueStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  abortedJobs: number;
  retriedJobs: number;
  averageProcessingTime?: number;
  lastUpdateTime: Date;
}

/**
 * Base class for implementing job queues with different storage backends.
 */
export class JobQueue<Input, Output, QueueJob extends Job<Input, Output> = Job<Input, Output>> {
  protected options: JobQueueOptions<Input, Output>;
  protected readonly limiter: ILimiter;
  protected readonly storage: IQueueStorage<Input, Output>;

  /**
   * Creates a new job queue
   * @param queueName The name of the queue
   * @param jobClass The class of the job to be used in the queue
   * @param options The options for the queue
   */
  constructor(
    public readonly queueName: string,
    public readonly jobClass: new (param: JobConstructorParam<Input, Output>) => QueueJob,
    options: JobQueueOptions<Input, Output>
  ) {
    const { limiter, storage, ...rest } = options;
    this.options = {
      waitDurationInMilliseconds: 100,
      ...rest,
    };
    this.limiter = limiter ?? new NullLimiter();
    this.storage = storage ?? new InMemoryQueueStorage<Input, Output>(queueName);
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      abortedJobs: 0,
      retriedJobs: 0,
      lastUpdateTime: new Date(),
    };
  }

  protected running: boolean = false;
  protected stats: JobQueueStats = {
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    abortedJobs: 0,
    retriedJobs: 0,
    lastUpdateTime: new Date(),
  };
  protected events = new EventEmitter<JobQueueEventListeners<Input, Output>>();
  protected activeJobSignals: Map<unknown, AbortController> = new Map();
  protected activeJobPromises: Map<
    unknown,
    Array<{ resolve: (out: Output) => void; reject: (err: JobError) => void }>
  > = new Map();
  protected processingTimes: Map<unknown, number> = new Map();
  protected mode: QueueMode = QueueMode.BOTH;
  protected jobProgressListeners: Map<unknown, Set<JobProgressListener>> = new Map();
  protected lastKnownProgress: Map<
    unknown,
    {
      progress: number;
      message: string;
      details: Record<string, any>;
    }
  > = new Map();

  /**
   * Gets a job from the queue
   * @param id The ID of the job to get
   */
  public async get(id: unknown) {
    if (!id) throw new Error("Cannot get undefined job");
    const job = await this.storage.get(id);
    if (!job) return undefined;
    return this.createNewJob(job);
  }

  /**
   * Adds a job to the queue
   * @param job The job to add
   */
  public async add(job: QueueJob) {
    const jobId = await this.storage.add(this.jobToStorage(job));
    return jobId;
  }

  /**
   * Gets the next job from the queue
   */
  public async next() {
    const job = await this.storage.next();
    if (!job) return undefined;
    return this.createNewJob(job);
  }

  /**
   * Peek into the queue
   * @param status The status of the job to peek at
   * @param num The number of jobs to peek at
   */
  public async peek(status?: JobStatus, num?: number) {
    const jobs = await this.storage.peek(status, num);
    return jobs.map((job) => this.createNewJob(job));
  }

  /**
   * Gets the size of the queue
   * @param status The status of the jobs to get the size of
   */
  public async size(status?: JobStatus) {
    return this.storage.size(status);
  }

  /**
   * Completes a job
   * @param id The ID of the job to complete
   * @param output The output of the job
   * @param error The error of the job
   */
  public async complete(id: unknown, output?: Output, error?: JobError) {
    if (!id) throw new Error("Cannot complete undefined job");
    const job = await this.get(id);
    if (!job) {
      // If the job is not found, it might have been deleted already
      // Just log a warning and return without throwing
      console.warn(`Job ${id} not found when completing - it may have been deleted`);
      return;
    }

    job.progressMessage = "";
    job.progressDetails = null;

    if (error) {
      job.error = error.message;
      job.errorCode = error.name;
      job.retries = (job.retries || 0) + 1;

      if (error instanceof RetryableJobError) {
        if (job.retries >= job.maxRetries) {
          job.status = JobStatus.FAILED;
          job.progress = 100;
          job.completedAt = new Date();
        } else {
          job.status = JobStatus.PENDING;
          job.runAfter = error.retryDate;
          job.progress = 0;
        }
      } else {
        // Both PermanentJobError and other errors result in FAILED status
        job.status = JobStatus.FAILED;
        job.progress = 100;
        job.completedAt = new Date();
      }
    } else {
      job.status = JobStatus.COMPLETED;
      job.progress = 100;
      job.output = output ?? null;
      job.error = null;
      job.errorCode = null;
      job.completedAt = new Date();
    }
    await this.storage.complete(this.jobToStorage(job));

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      if (job && this.shouldDeleteJobImmediately(job)) {
        await this.delete(job.id);
      }

      const promises = this.activeJobPromises.get(job.id) || [];

      if (job.status === JobStatus.FAILED) {
        this.stats.failedJobs++;
        this.events.emit("job_error", this.queueName, job.id, `${error!.name}: ${error!.message}`);
        promises.forEach(({ reject }) => reject(error!));
      } else if (job.status === JobStatus.COMPLETED) {
        this.stats.completedJobs++;
        this.events.emit("job_complete", this.queueName, job.id, output!);
        promises.forEach(({ resolve }) => resolve(output!));
      } else {
        console.error(`Unknown job status: ${job.status}`);
      }

      // Clear any remaining state
      this.activeJobSignals.delete(job.id);
      this.lastKnownProgress.delete(job.id);
      this.jobProgressListeners.delete(job.id);
      this.activeJobPromises.delete(job.id);
      this.emitStatsUpdate();
    }
  }

  /**
   * Aborts a job
   * @param jobId The ID of the job to abort
   */
  public async abort(jobId: unknown) {
    if (!jobId) throw new Error("Cannot abort undefined job");
    await this.storage.abort(jobId);

    const controller = this.activeJobSignals.get(jobId);
    if (controller) {
      if (!controller.signal.aborted) {
        try {
          controller.abort();
        } catch (err) {}
      }
    }
    this.events.emit("job_aborting", this.queueName, jobId);
  }

  /**
   * Deletes a job from the queue
   * @param id The ID of the job to delete
   */
  public async delete(id: unknown) {
    if (!id) throw new Error("Cannot delete undefined job");
    await this.storage.delete(id);
  }

  /**
   * Gets jobs by run ID
   * @param runId The ID of the run to get jobs for
   */
  public async getByRunId(runId: string) {
    if (!runId) throw new Error("Cannot get jobs by undefined runId");
    const jobs = await this.storage.getByRunId(runId);
    return jobs.map((job) => this.createNewJob(job));
  }

  /**
   * Gets the output for an input
   * @param input The input to get the output for
   */
  public async outputForInput(input: Input) {
    if (!input) throw new Error("Cannot get output for undefined input");
    return this.storage.outputForInput(input);
  }

  /**
   * Saves the progress for a job
   * @param id The ID of the job to save progress for
   * @param progress The progress of the job
   * @param message The message of the job
   * @param details The details of the job
   */
  public async saveProgress(
    id: unknown,
    progress: number,
    message: string,
    details: Record<string, any> | null
  ) {
    if (!id) throw new Error("Cannot save progress for undefined job");
    await this.storage.saveProgress(id, progress, message, details);
  }

  /**
   * Aborts all jobs in a job run
   */
  public async abortJobRun(jobRunId: string): Promise<void> {
    if (!jobRunId) throw new Error("Cannot abort job run with undefined jobRunId");
    const jobs = await this.getByRunId(jobRunId);
    await Promise.allSettled(
      jobs.map((job) => {
        if ([JobStatus.PROCESSING, JobStatus.PENDING].includes(job.status)) {
          this.abort(job.id);
        }
      })
    );
  }

  /**
   * Executes a job with the provided abort signal.
   * Can be overridden by implementations to add custom execution logic.
   */
  public async executeJob(job: Job<Input, Output>, signal: AbortSignal): Promise<Output> {
    if (!job) throw new Error("Cannot execute null or undefined job");
    return await job.execute(signal);
  }

  /**
   * Registers an event listener for job queue events
   */
  public on<Event extends JobQueueEvents>(
    event: Event,
    listener: JobQueueEventListener<Event>
  ): void {
    this.events.on(event, listener);
  }

  /**
   * Removes an event listener for job queue events
   */
  public off<Event extends JobQueueEvents>(
    event: Event,
    listener: JobQueueEventListener<Event>
  ): void {
    this.events.off(event, listener);
  }

  /**
   * Adds an event listener for job queue events that will be called only once
   */
  public once<Event extends JobQueueEvents>(
    event: Event,
    listener: JobQueueEventListener<Event>
  ): void {
    this.events.once(event, listener);
  }

  /**
   * Returns a promise that resolves when the event is emitted
   */
  public emitted<Event extends JobQueueEvents>(
    event: Event
  ): Promise<JobQueueEventParameters<Event, Input, Output>> {
    return this.events.emitted(event) as Promise<JobQueueEventParameters<Event, Input, Output>>;
  }

  /**
   * Creates an abort controller for a job and adds it to the activeJobSignals map
   */
  protected createAbortController(jobId: unknown): AbortController {
    if (!jobId) throw new Error("Cannot create abort controller for undefined job");
    if (this.activeJobSignals.has(jobId)) {
      throw new Error(`Abort controller for job ${jobId} already exists`);
    }
    const abortController = new AbortController();
    this.activeJobSignals.set(jobId, abortController);
    return abortController;
  }

  /**
   * Deletes an abort controller for a job
   */
  protected deleteAbortController(jobId: unknown): void {
    this.activeJobSignals.delete(jobId);
  }

  /**
   * Checks if a job should be deleted based on its status and completion time
   */
  protected shouldDeleteJobImmediately(job: Job<Input, Output>): boolean {
    // If the job is not completed/failed, it should not be deleted
    if (!job.completedAt) return false;

    if (job.status === JobStatus.COMPLETED && this.options.deleteAfterCompletionMs === 0) {
      return true;
    } else if (job.status === JobStatus.FAILED && this.options.deleteAfterFailureMs === 0) {
      return true;
    }
    return false;
  }

  async getJobsByRunId(runId: string): Promise<Job<Input, Output>[]> {
    const jobs = await this.storage.getByRunId(runId);
    return jobs.map((job) => this.createNewJob(job));
  }

  /**
   * Processes a job and handles its lifecycle including retries and error handling
   */
  protected async processJob(job: Job<Input, Output>): Promise<void> {
    if (!job || !job.id) throw new Error("Invalid job provided for processing");

    const startTime = Date.now();

    try {
      await this.validateJobState(job);
      await this.limiter.recordJobStart();
      this.emitStatsUpdate();

      const abortController = this.createAbortController(job.id);
      this.events.emit("job_start", this.queueName, job.id);
      const output = await this.executeJob(job, abortController.signal);
      await this.complete(job.id, output);

      this.processingTimes.set(job.id, Date.now() - startTime);
      this.updateAverageProcessingTime();
    } catch (err: any) {
      const error = this.normalizeError(err);
      await this.complete(job.id, undefined, error);

      if (error instanceof AbortSignalJobError) {
        this.events.emit("job_aborting", this.queueName, job.id);
        this.stats.abortedJobs++;
      } else if (error instanceof RetryableJobError) {
        this.events.emit("job_retry", this.queueName, job.id, error.retryDate);
        this.stats.retriedJobs++;
      } else {
        this.events.emit("job_error", this.queueName, job.id, error.message);
        this.stats.failedJobs++;
      }
    } finally {
      await this.limiter.recordJobCompletion();

      this.deleteAbortController(job.id);
      this.emitStatsUpdate();
    }
  }

  /**
   * Validates the state of a job before processing
   */
  protected async validateJobState(job: Job<Input, Output>): Promise<void> {
    if (job.status === JobStatus.COMPLETED) {
      throw new PermanentJobError(`Job ${job.id} is already completed`);
    }
    if (job.status === JobStatus.FAILED) {
      throw new PermanentJobError(`Job ${job.id} has failed`);
    }
    if (job.status === JobStatus.ABORTING) {
      throw new AbortSignalJobError(`Job ${job.id} is being aborted`);
    }
    if (job.deadlineAt && job.deadlineAt < new Date()) {
      throw new PermanentJobError(`Job ${job.id} has exceeded its deadline`);
    }
  }

  /**
   * Normalizes different types of errors into JobError instances
   */
  protected normalizeError(err: any): JobError {
    if (err instanceof JobError) {
      return err;
    }
    if (err instanceof Error) {
      return new PermanentJobError(err.message);
    }
    return new PermanentJobError(String(err));
  }

  /**
   * Updates average processing time statistics
   */
  protected updateAverageProcessingTime(): void {
    const times = Array.from(this.processingTimes.values());
    if (times.length > 0) {
      this.stats.averageProcessingTime = times.reduce((a, b) => a + b, 0) / times.length;
    }
  }

  /**
   * Emits updated statistics
   */
  protected emitStatsUpdate(): void {
    this.stats.lastUpdateTime = new Date();
    this.events.emit("queue_stats_update", this.queueName, { ...this.stats });
  }

  /**
   * Returns a promise that resolves when the job completes
   */
  public async waitFor(jobId: unknown): Promise<Output> {
    if (!jobId) throw new Error("Cannot wait for undefined job");
    return new Promise((resolve, reject) => {
      const promises = this.activeJobPromises.get(jobId) || [];
      promises.push({ resolve, reject });
      this.activeJobPromises.set(jobId, promises);
    });
  }

  /**
   * Updates the progress of a job
   * @param jobId - The ID of the job to update
   * @param progress - Progress value between 0 and 100
   * @param message - Optional message describing the current progress state
   * @param details - Optional structured data about the progress
   */
  public async updateProgress(
    jobId: unknown,
    progress: number,
    message: string = "",
    details: Record<string, any> | null = null
  ): Promise<void> {
    const job = await this.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if ([JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.ABORTING].includes(job.status)) {
      return;
    }

    // Validate progress value
    progress = Math.max(0, Math.min(100, progress));

    job.progress = progress;
    job.progressMessage = message;
    job.progressDetails = details;

    await this.saveProgress(jobId, progress, message, details ?? null);

    // Emit the general event
    this.events.emit("job_progress", this.queueName, jobId, progress, message, details);

    // Notify job-specific listeners
    const listeners = this.jobProgressListeners.get(jobId);
    if (listeners) {
      for (const listener of listeners) {
        listener(progress, message, details);
      }
    }
  }

  /**
   * Returns current queue statistics
   */
  public getStats(): JobQueueStats {
    return { ...this.stats };
  }

  /**
   * Adds a progress listener for a specific job
   * @param jobId - The ID of the job to listen to
   * @param listener - The callback function to be called when progress updates occur
   * @returns A cleanup function to remove the listener
   */
  public onJobProgress(jobId: unknown, listener: JobProgressListener): () => void {
    if (!this.jobProgressListeners.has(jobId)) {
      this.jobProgressListeners.set(jobId, new Set());
    }
    const listeners = this.jobProgressListeners.get(jobId)!;
    listeners.add(listener);

    return () => {
      const listeners = this.jobProgressListeners.get(jobId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.jobProgressListeners.delete(jobId);
        }
      }
    };
  }

  /**
   * Removes all progress listeners for a specific job
   * @param jobId - The ID of the job to remove listeners for
   */
  public removeAllJobProgressListeners(jobId: unknown): void {
    this.jobProgressListeners.delete(jobId);
  }

  /**
   * Creates a new job instance from the provided database results.
   * @param details - The job data from the database
   * @returns A new Job instance with populated properties
   */
  protected createNewJob(details: JobStorageFormat<Input, Output>): Job<Input, Output> {
    const toDate = (date: string | null | undefined): Date | null => {
      if (!date) return null;
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d;
    };
    const job = new this.jobClass({
      id: details.id,
      jobRunId: details.jobRunId,
      queueName: details.queue,
      fingerprint: details.fingerprint,
      input: details.input as unknown as Input,
      output: details.output as unknown as Output,
      runAfter: toDate(details.runAfter),
      createdAt: toDate(details.createdAt)!,
      deadlineAt: toDate(details.deadlineAt),
      lastRanAt: toDate(details.lastRanAt),
      completedAt: toDate(details.completedAt),
      progress: details.progress || 0,
      progressMessage: details.progressMessage || "",
      progressDetails: details.progressDetails ?? null,
      status: details.status as JobStatus,
      error: details.error ?? null,
      errorCode: details.errorCode ?? null,
      retries: details.retries ?? 0,
      maxRetries: details.maxRetries ?? 10,
    });
    job.queue = this;
    return job;
  }

  /**
   * Converts a Job instance to a JobDetails object
   * @param job - The Job instance to convert
   * @returns A JobDetails object with the same properties as the Job instance
   */
  public jobToStorage(job: Job<Input, Output>): JobStorageFormat<Input, Output> {
    // Helper to safely convert Date to ISO string
    const dateToISOString = (date: Date | null | undefined): string | null => {
      if (!date) return null;
      // Check if date is valid before converting
      return isNaN(date.getTime()) ? null : date.toISOString();
    };
    const now = new Date().toISOString();
    return {
      id: job.id,
      jobRunId: job.jobRunId,
      queue: job.queueName,
      fingerprint: job.fingerprint,
      input: job.input,
      status: job.status,
      output: job.output ?? null,
      error: String(job.error) || null,
      errorCode: job.errorCode || null,
      retries: job.retries ?? 0,
      maxRetries: job.maxRetries ?? 10,
      runAfter: dateToISOString(job.runAfter) ?? now,
      createdAt: dateToISOString(job.createdAt) ?? now,
      deadlineAt: dateToISOString(job.deadlineAt),
      lastRanAt: dateToISOString(job.lastRanAt),
      completedAt: dateToISOString(job.completedAt),
      progress: job.progress ?? 0,
      progressMessage: job.progressMessage ?? "",
      progressDetails: job.progressDetails ?? null,
    };
  }

  /**
   * Main job processing loop
   */
  private async processJobs(): Promise<void> {
    if (!this.running) {
      return;
    }
    try {
      // clean up any completed or failed jobs
      await this.cleanUpJobs();

      // process the jobs
      const canProceed = await this.limiter.canProceed();
      if (canProceed) {
        const job = await this.next();
        if (job) {
          this.processJob(job);
        }
      }
    } finally {
      setTimeout(() => this.processJobs(), this.options.waitDurationInMilliseconds);
    }
  }

  private async cleanUpJobs(): Promise<void> {
    // delete any completed or failed jobs
    if (this.options.deleteAfterCompletionMs) {
      await this.storage.deleteJobsByStatusAndAge(
        JobStatus.COMPLETED,
        this.options.deleteAfterCompletionMs
      );
    }
    if (this.options.deleteAfterFailureMs) {
      await this.storage.deleteJobsByStatusAndAge(
        JobStatus.FAILED,
        this.options.deleteAfterFailureMs
      );
    }
  }

  /**
   * Monitors jobs that have progress listeners attached
   * Polls for updates to jobs being processed elsewhere
   * Only emits events when progress state has changed
   */
  private async monitorJobs(): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      // Get all jobs that have listeners
      const jobIds = Array.from(this.jobProgressListeners.keys());

      // For each job with listeners, check its current state
      for (const jobId of jobIds) {
        const job = await this.get(jobId);
        if (job) {
          const currentProgress = {
            progress: job.progress,
            message: job.progressMessage,
            details: job.progressDetails || {},
          };

          const lastProgress = this.lastKnownProgress.get(jobId);

          // Check if progress has changed
          const hasChanged =
            !lastProgress ||
            lastProgress.progress !== currentProgress.progress ||
            lastProgress.message !== currentProgress.message;
          // || JSON.stringify(lastProgress.details) !== JSON.stringify(currentProgress.details);

          if (hasChanged) {
            // Update last known state
            this.lastKnownProgress.set(jobId, currentProgress);

            // Emit progress event
            this.events.emit(
              "job_progress",
              this.queueName,
              jobId,
              currentProgress.progress,
              currentProgress.message,
              currentProgress.details
            );
          }
        }
      }

      // Clean up completed jobs from lastKnownProgress
      for (const jobId of this.lastKnownProgress.keys()) {
        const job = await this.get(jobId);
        if (!job || job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
          this.lastKnownProgress.delete(jobId);
        }
      }
    } catch (error) {
      console.error(`Error in monitorJobs: ${error}`);
    }

    // Schedule next monitoring iteration
    setTimeout(() => this.monitorJobs(), this.options.waitDurationInMilliseconds);
  }

  /**
   * Starts the job queue based on its operating mode
   */
  public async start(mode: QueueMode = QueueMode.BOTH) {
    if (this.running) {
      return this;
    }
    this.mode = mode;

    this.running = true;
    this.events.emit("queue_start", this.queueName);

    // Start job processing if in SERVER or BOTH mode
    if (this.mode !== QueueMode.CLIENT) {
      this.processJobs();
    }

    // Start job monitoring if in CLIENT or BOTH mode
    if (this.mode !== QueueMode.SERVER) {
      this.monitorJobs();
    }

    return this;
  }

  /**
   * Stops the job queue and aborts all active jobs
   */
  public async stop() {
    if (this.running === false) return this;
    this.running = false;

    // Wait for pending operations to settle
    const size = await this.size(JobStatus.PROCESSING);
    const sleepTime = Math.max(100, size * 2);
    await sleep(sleepTime);

    // Abort all active jobs
    for (const [jobId] of this.activeJobSignals.entries()) {
      this.abort(jobId);
    }

    // Reject all waiting promises
    this.activeJobPromises.forEach((promises) =>
      promises.forEach(({ reject }) => reject(new PermanentJobError("Queue Stopped")))
    );

    // Wait for abort operations to settle
    await sleep(sleepTime);

    this.events.emit("queue_stop", this.queueName);
    return this;
  }

  /**
   * Clears all jobs and resets queue state
   */
  public async clear() {
    await this.storage.deleteAll();
    this.activeJobSignals.clear();
    this.activeJobPromises.clear();
    this.processingTimes.clear();
    this.lastKnownProgress.clear();
    this.jobProgressListeners.clear();
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      abortedJobs: 0,
      retriedJobs: 0,
      lastUpdateTime: new Date(),
    };
    this.emitStatsUpdate();
    return this;
  }

  /**
   * Restarts the job queue
   */
  public async restart() {
    await this.stop();
    await this.clear();
    await this.start();
    return this;
  }
}
