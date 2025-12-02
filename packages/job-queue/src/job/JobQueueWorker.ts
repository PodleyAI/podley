/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IQueueStorage, JobStatus, JobStorageFormat } from "@workglow/storage";
import { EventEmitter, sleep } from "@workglow/util";
import { ILimiter, JOB_LIMITER } from "../limiter/ILimiter";
import { NullLimiter } from "../limiter/NullLimiter";
import { Job, JobConstructorParam } from "./Job";
import {
  AbortSignalJobError,
  JobDisabledError,
  JobError,
  JobNotFoundError,
  PermanentJobError,
  RetryableJobError,
} from "./JobError";
import { JobQueueOptions, JobStatus as IJobQueueJobStatus } from "./IJobQueue";
import {
  JobQueueEventListener,
  JobQueueEventListeners,
  JobQueueEvents,
} from "./JobQueueEventListeners";
import { JobQueueStats } from "./JobQueue";
import { globalServiceRegistry } from "@workglow/util";

type JobClass<Input, Output> = new (
  param: JobConstructorParam<Input, Output>
) => Job<Input, Output>;

/**
 * Worker for executing jobs from the queue.
 * Processes jobs but does not accept new submissions.
 */
export class JobQueueWorker<
  Input,
  Output,
  QueueJob extends Job<Input, Output> = Job<Input, Output>
> {
  public readonly queueName: string;
  public readonly jobClass: JobClass<Input, Output>;
  protected readonly storage: IQueueStorage<Input, Output>;
  protected readonly limiter: ILimiter;
  protected options: JobQueueOptions<Input, Output>;
  protected running: boolean = false;
  protected events = new EventEmitter<JobQueueEventListeners<Input, Output>>();
  protected activeJobAbortControllers: Map<unknown, AbortController> = new Map();
  protected processingTimes: Map<unknown, number> = new Map();
  protected stats: JobQueueStats = {
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    abortedJobs: 0,
    retriedJobs: 0,
    disabledJobs: 0,
    lastUpdateTime: new Date(),
  };

  constructor(
    queueName: string,
    jobClass: JobClass<Input, Output>,
    storage: IQueueStorage<Input, Output>,
    options: JobQueueOptions<Input, Output> = {}
  ) {
    this.queueName = queueName;
    this.jobClass = jobClass;
    this.storage = storage;
    const { limiter, ...rest } = options;
    this.options = {
      waitDurationInMilliseconds: 100,
      ...rest,
    };

    if (limiter) {
      this.limiter = limiter;
    } else {
      try {
        this.limiter = globalServiceRegistry.get(JOB_LIMITER);
      } catch (err) {
        console.warn("Warning: did not find job limiter in global DI", err);
        this.limiter = new NullLimiter();
      }
    }
  }

  /**
   * Start processing jobs
   */
  public async start() {
    if (this.running) {
      return this;
    }
    this.running = true;
    this.events.emit("queue_start", this.queueName);
    await this.fixupJobs();
    await this.processJobs();
    return this;
  }

  /**
   * Stop processing jobs
   */
  public async stop() {
    if (!this.running) return this;
    this.running = false;

    const size = await this.storage.size(JobStatus.PROCESSING);
    const sleepTime = Math.max(100, size * 2);
    await sleep(sleepTime);

    for (const [jobId] of this.activeJobAbortControllers.entries()) {
      await this.abort(jobId);
    }

    await sleep(sleepTime);

    this.events.emit("queue_stop", this.queueName);
    return this;
  }

  /**
   * Clear local state (does not affect storage)
   */
  public async clear() {
    this.activeJobAbortControllers.clear();
    this.processingTimes.clear();
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      abortedJobs: 0,
      retriedJobs: 0,
      disabledJobs: 0,
      lastUpdateTime: new Date(),
    };
    return this;
  }

  /**
   * Restart the worker
   */
  public async restart() {
    await this.stop();
    await this.clear();
    await this.start();
    return this;
  }

  /**
   * Get worker statistics
   */
  public getStats(): JobQueueStats {
    return { ...this.stats };
  }

  /**
   * Execute a job with the provided abort signal
   */
  public async executeJob(job: Job<Input, Output>, signal: AbortSignal): Promise<Output> {
    if (!job) throw new JobNotFoundError("Cannot execute null or undefined job");
    return await job.execute(job.input, {
      signal,
      updateProgress: async (progress, message, details) => {
        await this.storage.saveProgress(job.id, progress, message || "", details || null);
      },
    });
  }

  /**
   * Abort a job
   */
  public async abort(jobId: unknown) {
    if (!jobId) throw new JobNotFoundError("Cannot abort undefined job");
    await this.storage.abort(jobId);

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
   * Register event listeners
   */
  public on<Event extends JobQueueEvents>(
    event: Event,
    listener: JobQueueEventListener<Event>
  ): void {
    this.events.on(event, listener);
  }

  /**
   * Remove event listeners
   */
  public off<Event extends JobQueueEvents>(
    event: Event,
    listener: JobQueueEventListener<Event>
  ): void {
    this.events.off(event, listener);
  }

  // ========================================================================
  // Protected methods
  // ========================================================================

  protected async get(id: unknown) {
    if (!id) throw new JobNotFoundError("Cannot get undefined job");
    const job = await this.storage.get(id);
    if (!job) return undefined;
    return this.storageToClass(job);
  }

  protected async next() {
    const job = await this.storage.next();
    if (!job) return undefined;
    return this.storageToClass(job);
  }

  protected createAbortController(jobId: unknown): AbortController {
    if (!jobId) throw new JobNotFoundError("Cannot create abort controller for undefined job");
    if (this.activeJobAbortControllers.has(jobId)) {
      return this.activeJobAbortControllers.get(jobId)!;
    }
    const abortController = new AbortController();
    abortController.signal.addEventListener("abort", () => this.handleAbort(jobId));
    this.activeJobAbortControllers.set(jobId, abortController);
    return abortController;
  }

  protected async handleAbort(jobId: unknown) {
    const job = await this.get(jobId);
    if (!job) {
      console.error("handleAbort: job not found", jobId);
      return;
    }
    const error = new AbortSignalJobError("Job Aborted");
    await this.failJob(job, error);
    this.stats.abortedJobs++;
  }

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
    if (job.status === JobStatus.DISABLED) {
      throw new JobDisabledError(`Job ${job.id} has been disabled`);
    }
  }

  protected normalizeError(err: any): JobError {
    if (err instanceof JobError) {
      return err;
    }
    if (err instanceof Error) {
      return err as JobError;
    }
    return new PermanentJobError(String(err));
  }

  protected updateAverageProcessingTime(): void {
    const times = Array.from(this.processingTimes.values());
    if (times.length > 0) {
      this.stats.averageProcessingTime = times.reduce((a, b) => a + b, 0) / times.length;
    }
  }

  protected emitStatsUpdate(): void {
    this.stats.lastUpdateTime = new Date();
    this.events.emit("queue_stats_update", this.queueName, { ...this.stats });
  }

  protected async rescheduleJob(job: Job<Input, Output>, retryDate?: Date) {
    try {
      job.status = JobStatus.PENDING;
      const nextAvailableTime = await this.limiter.getNextAvailableTime();
      job.runAfter = retryDate instanceof Date ? retryDate : nextAvailableTime;
      job.progress = 0;
      job.progressMessage = "";
      job.progressDetails = null;
      await this.storage.complete(this.classToStorage(job));

      this.stats.retriedJobs++;
      this.events.emit("job_retry", this.queueName, job.id, job.runAfter);
    } catch (err) {
      console.error("rescheduleJob", err);
    }
  }

  protected async disableJob(job: Job<Input, Output>) {
    try {
      job.status = JobStatus.DISABLED;
      job.progress = 100;
      job.completedAt = new Date();
      job.progressMessage = "";
      job.progressDetails = null;
      await this.storage.complete(this.classToStorage(job));
      if (this.options.deleteAfterDisabledMs === 0) {
        await this.storage.delete(job.id);
      }
      this.stats.disabledJobs++;
      this.events.emit("job_disabled", this.queueName, job.id);
    } catch (err) {
      console.error("disableJob", err);
    }
  }

  protected async failJob(job: Job<Input, Output>, error: JobError) {
    try {
      job.status = JobStatus.FAILED;
      job.progress = 100;
      job.completedAt = new Date();
      job.progressMessage = "";
      job.progressDetails = null;
      job.error = error.message;
      job.errorCode = error?.constructor?.name ?? null;

      await this.storage.complete(this.classToStorage(job));
      if (this.options.deleteAfterFailureMs === 0) {
        await this.storage.delete(job.id);
      }

      this.stats.failedJobs++;
      this.events.emit("job_error", this.queueName, job.id, `${error!.name}: ${error!.message}`);
    } catch (err) {
      console.error("failJob errored out?", err);
    }

    this.activeJobAbortControllers.delete(job.id);
  }

  protected async completeJob(job: Job<Input, Output>, output?: Output) {
    try {
      job.status = JobStatus.COMPLETED;
      job.progress = 100;
      job.progressMessage = "";
      job.progressDetails = null;
      job.completedAt = new Date();
      job.output = output ?? null;
      job.error = null;
      job.errorCode = null;
      await this.storage.complete(this.classToStorage(job));
      if (job && this.options.deleteAfterCompletionMs === 0) {
        await this.storage.delete(job.id);
      }

      this.stats.completedJobs++;
      this.events.emit("job_complete", this.queueName, job.id, output!);
    } catch (err) {
      console.error("completeJob errored out?", err);
    }
    this.activeJobAbortControllers.delete(job.id);
  }

  protected async processSingleJob(job: Job<Input, Output>): Promise<void> {
    if (!job || !job.id) throw new JobNotFoundError("Invalid job provided for processing");

    const startTime = Date.now();

    try {
      await this.validateJobState(job);
      await this.limiter.recordJobStart();
      this.emitStatsUpdate();

      const abortController = this.createAbortController(job.id);
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

  protected async processJobs(): Promise<void> {
    if (!this.running) {
      return;
    }
    try {
      await this.cleanUpJobs();

      const canProceed = await this.limiter.canProceed();
      if (canProceed) {
        const job = await this.next();
        if (job) {
          this.processSingleJob(job);
        }
      }
    } finally {
      setTimeout(() => this.processJobs(), this.options.waitDurationInMilliseconds);
    }
  }

  protected async cleanUpJobs(): Promise<void> {
    const abortingJobs = await this.storage.peek(JobStatus.ABORTING);
    for (const jobData of abortingJobs) {
      const job = this.storageToClass(jobData);
      await this.handleAbort(job.id);
    }
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

  protected async fixupJobs() {
    const stuckProcessingJobs = await this.storage.peek(JobStatus.PROCESSING);
    const stuckAbortingJobs = await this.storage.peek(JobStatus.ABORTING);
    const stuckJobs = [...stuckProcessingJobs, ...stuckAbortingJobs];
    for (const jobData of stuckJobs) {
      const job = this.storageToClass(jobData);
      job.status = JobStatus.PENDING;
      job.runAfter = job.lastRanAt || new Date();
      job.progress = 0;
      job.progressMessage = "";
      job.progressDetails = null;
      job.error = "Restarting server";
      await this.storage.complete(this.classToStorage(job));
      await this.rescheduleJob(job, job.lastRanAt!);
    }
  }

  protected storageToClass(details: JobStorageFormat<Input, Output>): Job<Input, Output> {
    const toDate = (date: string | null | undefined): Date | null => {
      if (!date) return null;
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d;
    };
    return new this.jobClass({
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
  }

  protected classToStorage(job: Job<Input, Output>): JobStorageFormat<Input, Output> {
    const dateToISOString = (date: Date | null | undefined): string | null => {
      if (!date) return null;
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
}
