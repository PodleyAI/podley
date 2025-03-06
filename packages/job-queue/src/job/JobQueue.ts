//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IQueueStorage, InMemoryQueueStorage, JobStorageFormat } from "@ellmers/storage";
import { EventEmitter, sleep } from "@ellmers/util";
import { IJobQueue, JobQueueOptions, QueueMode } from "./IJobQueue";
import { ILimiter } from "./ILimiter";
import { Job, JobConstructorParam, JobStatus } from "./Job";
import {
  AbortSignalJobError,
  JobError,
  JobNotFoundError,
  PermanentJobError,
  RetryableJobError,
} from "./JobError";
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

type JobClass<Input, Output> = new (
  param: JobConstructorParam<Input, Output>
) => Job<Input, Output>;

/**
 * Base class for implementing job queues with different storage backends.
 */
export class JobQueue<Input, Output, QueueJob extends Job<Input, Output> = Job<Input, Output>>
  implements IJobQueue<Input, Output>
{
  /**
   * The name of the queue
   */
  public readonly queueName: string;

  /**
   * The class of the job to be used in the queue
   */
  public readonly jobClass: JobClass<Input, Output>;

  /**
   * The options for the queue
   */
  protected options: JobQueueOptions<Input, Output>;

  constructor(
    queueName: string,
    jobClass: JobClass<Input, Output>,
    options: JobQueueOptions<Input, Output>
  ) {
    this.queueName = queueName;
    this.jobClass = jobClass;
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

  // ========================================================================
  // Job Management public methods
  // ========================================================================

  /**
   * Gets a job from the queue
   * @param id The ID of the job to get
   */
  public async get(id: unknown) {
    if (!id) throw new JobNotFoundError("Cannot get undefined job");
    const job = await this.storage.get(id);
    if (!job) return undefined;
    return this.storageToClass(job);
  }

  /**
   * Adds a job to the queue
   * @param job The job to add
   */
  public async add(job: QueueJob) {
    const jobId = await this.storage.add(this.classToStorage(job));
    return jobId;
  }

  /**
   * Gets the next job from the queue
   */
  public async next() {
    const job = await this.storage.next();
    if (!job) return undefined;
    return this.storageToClass(job);
  }

  /**
   * Peek into the queue
   * @param status The status of the job to peek at
   * @param num The number of jobs to peek at
   */
  public async peek(status?: JobStatus, num?: number) {
    const jobs = await this.storage.peek(status, num);
    return jobs.map((job) => this.storageToClass(job));
  }

  /**
   * Gets the size of the queue
   * @param status The status of the jobs to get the size of
   */
  public async size(status?: JobStatus) {
    return this.storage.size(status);
  }

  /**
   * Deletes a job from the queue
   * @param id The ID of the job to delete
   */
  public async delete(id: unknown) {
    if (!id) throw new JobNotFoundError("Cannot delete undefined job");
    await this.storage.delete(id);
  }

  /**
   * Returns current queue statistics
   */
  public getStats(): JobQueueStats {
    return { ...this.stats };
  }

  /**
   * Gets the output for an input
   * @param input The input to get the output for
   */
  public async outputForInput(input: Input) {
    if (!input) throw new JobNotFoundError("Cannot get output for undefined input");
    return this.storage.outputForInput(input);
  }

  /**
   * Executes a job with the provided abort signal.
   * Can be overridden by implementations to add custom execution logic.
   */
  public async executeJob(job: Job<Input, Output>, signal: AbortSignal): Promise<Output> {
    if (!job) throw new JobNotFoundError("Cannot execute null or undefined job");
    return await job.execute(signal);
  }

  /**
   * Returns a promise that resolves when the job completes
   */
  public async waitFor<Output>(jobId: unknown): Promise<Output> {
    if (!jobId) throw new JobNotFoundError("Cannot wait for undefined job");
    const job = await this.get(jobId);
    if (!job) throw new JobNotFoundError(`Job ${jobId} not found`);

    if (job.status === JobStatus.COMPLETED) {
      return job.output as Output;
    }
    if (job.status === JobStatus.FAILED) {
      throw job.error;
    }
    const { promise, resolve, reject } = Promise.withResolvers<Output>();
    const promises = this.activeJobPromises.get(job.id) || [];
    promises.push({ resolve, reject });
    this.activeJobPromises.set(job.id, promises);
    return promise as Promise<Output>;
  }

  /**
   * Updates the progress of a job
   * @param jobId - The ID of the job to update
   * @param progress - Progress value between 0 and 100
   * @param message - Optional message describing the current progress state
   * @param details - Optional structured data about the progress
   * @returns A promise that resolves when the progress is updated
   * @note If the job is completed, failed, or aborted, the progress will not be updated
   */
  public async updateProgress(
    jobId: unknown,
    progress: number,
    message: string = "",
    details: Record<string, any> | null = null
  ): Promise<void> {
    const job = await this.get(jobId);
    if (!job) throw new JobNotFoundError(`Job ${jobId} not found`);

    if ([JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.ABORTING].includes(job.status)) {
      return;
    }

    // Validate progress value
    progress = Math.max(0, Math.min(100, progress));

    job.progress = progress;
    job.progressMessage = message;
    job.progressDetails = details;

    await this.saveProgress(jobId, progress, message, details ?? null);
    this.announceProgress(jobId, progress, message, details ?? null);
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
    if (this.mode === QueueMode.SERVER || this.mode === QueueMode.BOTH) {
      await this.fixupJobs();
      await this.processJobs();
    }

    // Start job monitoring if in CLIENT or BOTH mode
    if (this.mode === QueueMode.CLIENT || this.mode === QueueMode.BOTH) {
      await this.monitorJobs();
    }

    return this;
  }

  /**
   * Stops the job queue and aborts all active jobs
   */
  public async stop() {
    if (!this.running) return this;
    this.running = false;

    // Wait for pending operations to settle
    const size = await this.size(JobStatus.PROCESSING);
    const sleepTime = Math.max(100, size * 2);
    await sleep(sleepTime);

    // Abort all active jobs
    for (const [jobId] of this.activeJobAbortControllers.entries()) {
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
    this.activeJobAbortControllers.clear();
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

  // --------------  Job Run Management  --------------

  /**
   * Aborts all jobs in a job run
   */
  public async abortJobRun(jobRunId: string): Promise<void> {
    if (!jobRunId) throw new JobNotFoundError("Cannot abort job run with undefined jobRunId");
    const jobs = await this.getJobsByRunId(jobRunId);
    await Promise.allSettled(
      jobs.map((job) => {
        if ([JobStatus.PROCESSING, JobStatus.PENDING].includes(job.status)) {
          this.abort(job.id);
        }
      })
    );
  }

  /**
   * Gets jobs by run ID
   * @param runId The ID of the run to get jobs for
   */
  public async getJobsByRunId(runId: string): Promise<Job<Input, Output>[]> {
    if (!runId) throw new JobNotFoundError("Cannot get jobs by undefined runId");
    const jobs = await this.storage.getByRunId(runId);
    return jobs.map((job) => this.storageToClass(job));
  }

  // ========================================================================
  // Event handling
  // ========================================================================

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
  public waitOn<Event extends JobQueueEvents>(
    event: Event
  ): Promise<JobQueueEventParameters<Event, Input, Output>> {
    return this.events.waitOn(event) as Promise<JobQueueEventParameters<Event, Input, Output>>;
  }

  // ========================================================================
  // Protected properties
  // ========================================================================

  /**
   * The limiter for the queue
   */
  protected readonly limiter: ILimiter;

  /**
   * The storage for the queue
   */
  protected readonly storage: IQueueStorage<Input, Output>;

  /**
   * Whether the queue is running
   */
  protected running: boolean = false;

  /**
   * The stats for the queue
   */
  protected stats: JobQueueStats = {
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    abortedJobs: 0,
    retriedJobs: 0,
    lastUpdateTime: new Date(),
  };

  /**
   * The event emitter for the queue
   */
  protected events = new EventEmitter<JobQueueEventListeners<Input, Output>>();

  /**
   * The map of jobs to their promises for this worker instance
   */
  protected activeJobAbortControllers: Map<unknown, AbortController> = new Map();
  /**
   * Map of jobs to their promises for this worker instance
   * If this is both a server and client we can short-circuit
   * job aborting, wait on job completion, etc.
   */
  protected activeJobPromises: Map<
    unknown,
    Array<{
      resolve: (value?: any) => void;
      reject: (err: JobError) => void;
    }>
  > = new Map();
  protected processingTimes: Map<unknown, number> = new Map();
  protected mode: QueueMode = QueueMode.BOTH;
  protected jobProgressListeners: Map<unknown, Set<JobProgressListener>> = new Map();
  protected lastKnownProgress: Map<
    unknown,
    {
      progress: number;
      message: string;
      details: Record<string, any> | null;
    }
  > = new Map();

  // ========================================================================
  // Protected methods
  // ========================================================================

  /**
   * Saves the progress for a job
   * @param id The ID of the job to save progress for
   * @param progress The progress of the job
   * @param message The message of the job
   * @param details The details of the job
   */
  private async saveProgress(
    id: unknown,
    progress: number,
    message: string,
    details: Record<string, any> | null
  ) {
    if (!id) throw new JobNotFoundError("Cannot save progress for undefined job");
    await this.storage.saveProgress(id, progress, message, details);
  }

  /**
   * Creates an abort controller for a job and adds it to the activeJobSignals map
   */
  protected createAbortController(jobId: unknown): AbortController {
    if (!jobId) throw new JobNotFoundError("Cannot create abort controller for undefined job");
    if (this.activeJobAbortControllers.has(jobId)) {
      // retries reuse the same abort controller
      return this.activeJobAbortControllers.get(jobId)!;
    }
    const abortController = new AbortController();
    abortController.signal.addEventListener("abort", () => this.handleAbort(jobId));
    this.activeJobAbortControllers.set(jobId, abortController);
    return abortController;
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
    if (
      job.status === JobStatus.ABORTING ||
      this.activeJobAbortControllers.get(job.id)?.signal.aborted
    ) {
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
      return err as JobError;
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

  protected announceProgress(
    jobId: unknown,
    progress: number,
    message: string,
    details: Record<string, any> | null
  ) {
    this.lastKnownProgress.set(jobId, {
      progress,
      message,
      details,
    });

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
   * Creates a new job instance from the provided database results.
   * @param details - The job data from the database
   * @returns A new Job instance with populated properties
   */
  protected storageToClass(details: JobStorageFormat<Input, Output>): Job<Input, Output> {
    const toDate = (date: string | null | undefined): Date | null => {
      if (!date) return null;
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d;
    };
    const job = new this.jobClass({
      id: details.id,
      jobRunId: details.job_run_id,
      queueName: details.queue,
      fingerprint: details.fingerprint,
      input: details.input as unknown as Input,
      output: details.output as unknown as Output,
      runAfter: toDate(details.run_after),
      createdAt: toDate(details.created_at)!,
      deadlineAt: toDate(details.deadline_at),
      lastRanAt: toDate(details.last_ran_at),
      completedAt: toDate(details.completed_at),
      progress: details.progress || 0,
      progressMessage: details.progress_message || "",
      progressDetails: details.progress_details ?? null,
      status: details.status as JobStatus,
      error: details.error ?? null,
      errorCode: details.error_code ?? null,
      runAttempts: details.run_attempts ?? 0,
      maxRetries: details.max_retries ?? 10,
    });
    job.queue = this;
    return job;
  }

  /**
   * Converts a Job instance to a JobDetails object
   * @param job - The Job instance to convert
   * @returns A JobDetails object with the same properties as the Job instance
   */
  public classToStorage(job: Job<Input, Output>): JobStorageFormat<Input, Output> {
    // Helper to safely convert Date to ISO string
    const dateToISOString = (date: Date | null | undefined): string | null => {
      if (!date) return null;
      // Check if date is valid before converting
      return isNaN(date.getTime()) ? null : date.toISOString();
    };
    const now = new Date().toISOString();
    return {
      id: job.id,
      job_run_id: job.jobRunId,
      queue: job.queueName || this.queueName,
      fingerprint: job.fingerprint,
      input: job.input,
      status: job.status,
      output: job.output ?? null,
      error: job.error === null ? null : String(job.error),
      error_code: job.errorCode || null,
      run_attempts: job.runAttempts ?? 0,
      max_retries: job.maxRetries ?? 10,
      run_after: dateToISOString(job.runAfter) ?? now,
      created_at: dateToISOString(job.createdAt) ?? now,
      deadline_at: dateToISOString(job.deadlineAt),
      last_ran_at: dateToISOString(job.lastRanAt),
      completed_at: dateToISOString(job.completedAt),
      progress: job.progress ?? 0,
      progress_message: job.progressMessage ?? "",
      progress_details: job.progressDetails ?? null,
    };
  }

  protected async rescheduleJob(job: Job<Input, Output>, retryDate?: Date) {
    try {
      job.status = JobStatus.PENDING;
      const nextAvailableTime = await this.limiter.getNextAvailableTime();
      job.runAfter = retryDate instanceof Date ? retryDate : nextAvailableTime;
      job.progress = 0;
      job.progressMessage = "";
      job.progressDetails = null;
      job.runAttempts = (job.runAttempts || 0) + 1;
      await this.storage.complete(this.classToStorage(job));

      this.stats.retriedJobs++;
      this.events.emit("job_retry", this.queueName, job.id, job.runAfter);
    } catch (err) {
      console.error("rescheduleJob", err);
    }
  }

  protected async failJob(job: Job<Input, Output>, error: JobError) {
    try {
      job.status = JobStatus.FAILED;
      job.progress = 100;
      job.completedAt = new Date();
      job.progressMessage = "";
      job.progressDetails = null;
      job.runAttempts = (job.runAttempts || 0) + 1;
      job.error = error.message;
      job.errorCode = error?.constructor?.name ?? null;

      await this.storage.complete(this.classToStorage(job));
      if (this.options.deleteAfterFailureMs === 0) {
        await this.delete(job.id);
      }

      this.stats.failedJobs++;
      this.events.emit("job_error", this.queueName, job.id, `${error!.cause}: ${error!.message}`);

      const promises = this.activeJobPromises.get(job.id) || [];
      promises.forEach(({ reject }) => reject(error!));
      this.activeJobPromises.delete(job.id);
    } catch (err) {
      console.error("failJob errored out?", err);
    }

    // Clear any remaining state
    this.activeJobAbortControllers.delete(job.id);
    this.lastKnownProgress.delete(job.id);
    this.jobProgressListeners.delete(job.id);
    this.activeJobPromises.delete(job.id);
  }

  protected async completeJob(job: Job<Input, Output>, output?: Output) {
    try {
      job.status = JobStatus.COMPLETED;
      job.progress = 100;
      job.progressMessage = "";
      job.progressDetails = null;
      job.runAttempts = (job.runAttempts || 0) + 1;
      job.completedAt = new Date();
      job.output = output ?? null;
      job.error = null;
      job.errorCode = null;
      await this.storage.complete(this.classToStorage(job));
      if (job && this.options.deleteAfterCompletionMs === 0) {
        await this.delete(job.id);
      }

      this.stats.completedJobs++;
      this.events.emit("job_complete", this.queueName, job.id, output!);

      const promises = this.activeJobPromises.get(job.id);
      if (promises) {
        promises.forEach(({ resolve }) => resolve(output!));
      }
      this.activeJobPromises.delete(job.id);
    } catch (err) {
      console.error("completeJob errored out?", err);
    }
    // Clear any remaining state
    this.activeJobAbortControllers.delete(job.id);
    this.lastKnownProgress.delete(job.id);
    this.jobProgressListeners.delete(job.id);
    this.activeJobPromises.delete(job.id);
  }

  /**
   * Signals the abort of a job
   * @param jobId The ID of the job to abort
   */
  public async abort(jobId: unknown) {
    if (!jobId) throw new JobNotFoundError("Cannot abort undefined job");
    // we "store the abort signal" in the storage in case we are client
    // and not server for this job. we could avoid this is we were definitely
    // both, but better to have durability here.
    await this.storage.abort(jobId);

    // if we are server too, we need to abort the job
    // the abort controller will issue a a call to handleAbort
    let controller = this.activeJobAbortControllers.get(jobId);
    if (!controller) {
      controller = this.createAbortController(jobId);
    }
    if (!controller.signal.aborted) {
      controller.abort();
    }

    this.events.emit("job_aborting", this.queueName, jobId);
  }

  /**
   * Handles the abort of a job
   * @param jobId The ID of the job to abort
   */
  protected async handleAbort(jobId: unknown) {
    const promises = this.activeJobPromises.get(jobId);
    if (promises) {
      // we are both the client and the server, so we handle ourselfs
      // right away. (a server will poll the storage for abort signals)
      const job = await this.get(jobId);
      if (!job) {
        console.error("handleAbort: job not found", jobId);
        return;
      }
      const error = new AbortSignalJobError("Job Aborted");
      this.failJob(job, error);
    }
    this.stats.abortedJobs++;
  }

  /**
   * Processes a job and handles its lifecycle including runAttempts and error handling
   */
  protected async processSingleJob(job: Job<Input, Output>): Promise<void> {
    if (!job || !job.id) throw new JobNotFoundError("Invalid job provided for processing");

    const startTime = Date.now();

    try {
      await this.validateJobState(job);
      await this.limiter.recordJobStart();
      this.emitStatsUpdate();

      const abortController = this.createAbortController(job.id);
      this.lastKnownProgress.set(job.id, {
        progress: 0,
        message: "",
        details: null,
      });
      this.events.emit("job_start", this.queueName, job.id);
      const output = await this.executeJob(job, abortController.signal);
      await this.completeJob(job, output);
      this.processingTimes.set(job.id, Date.now() - startTime);
      this.updateAverageProcessingTime();
    } catch (err: any) {
      const error = this.normalizeError(err);
      if (error instanceof RetryableJobError) {
        if (job.runAttempts > job.maxRetries) {
          await this.failJob(job, error);
        } else {
          await this.rescheduleJob(job, error.retryDate);
        }
      } else {
        await this.failJob(job, error);
      }
    } finally {
      await this.limiter.recordJobCompletion();

      this.emitStatsUpdate();
    }
  }

  /**
   * Main job processing loop
   */
  protected async processJobs(): Promise<void> {
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
          // NOTE: We don't await the processJob here because we want to continue
          //       to process other jobs in the background
          this.processSingleJob(job);
        }
      }
    } finally {
      setTimeout(() => this.processJobs(), this.options.waitDurationInMilliseconds);
    }
  }

  protected async cleanUpJobs(): Promise<void> {
    const abortingJobs = await this.peek(JobStatus.ABORTING);
    for (const job of abortingJobs) {
      await this.handleAbort(job.id);
    }
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
  protected async monitorJobs(): Promise<void> {
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
            details: job.progressDetails || null,
          };

          const lastProgress = this.lastKnownProgress.get(jobId);

          // Check if progress has changed
          const hasChanged =
            !lastProgress ||
            lastProgress.progress !== currentProgress.progress ||
            lastProgress.message !== currentProgress.message;
          // || JSON.stringify(lastProgress.details) !== JSON.stringify(currentProgress.details);

          if (hasChanged && currentProgress.progress !== 0 && currentProgress.message !== "") {
            this.announceProgress(
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
   * Fixes stuck jobs when the server restarts
   */
  protected async fixupJobs() {
    const stuckProcessingJobs = await this.peek(JobStatus.PROCESSING);
    const stuckAbortingJobs = await this.peek(JobStatus.ABORTING);
    const stuckJobs = [...stuckProcessingJobs, ...stuckAbortingJobs];
    for (const job of stuckJobs) {
      job.status = JobStatus.PENDING;
      job.runAfter = job.lastRanAt || new Date();
      job.progress = 0;
      job.progressMessage = "";
      job.progressDetails = null;
      job.runAttempts = (job.runAttempts || 0) + 1;
      job.error = "Restarting server";
      await this.storage.complete(this.classToStorage(job));

      await this.rescheduleJob(job, job.lastRanAt!);
    }
  }
}
