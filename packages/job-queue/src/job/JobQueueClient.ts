/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IQueueStorage, JobStatus } from "@workglow/storage";
import { EventEmitter } from "@workglow/util";
import { Job, JobConstructorParam } from "./Job";
import { JobError, JobNotFoundError } from "./JobError";
import {
  JobProgressListener,
  JobQueueEventListener,
  JobQueueEventListeners,
  JobQueueEventParameters,
  JobQueueEvents,
} from "./JobQueueEventListeners";
import { IJobQueue, JobQueueOptions } from "./IJobQueue";
import { JobQueueStats } from "./JobQueue";

type JobClass<Input, Output> = new (
  param: JobConstructorParam<Input, Output>
) => Job<Input, Output>;

/**
 * Client for submitting jobs and monitoring progress.
 * Does not process jobs - only submits them and receives updates.
 */
export class JobQueueClient<
  Input,
  Output,
  QueueJob extends Job<Input, Output> = Job<Input, Output>
> implements Omit<IJobQueue<Input, Output>, "next" | "executeJob">
{
  public readonly queueName: string;
  public readonly jobClass: JobClass<Input, Output>;
  protected readonly storage: IQueueStorage<Input, Output>;
  protected options: JobQueueOptions<Input, Output>;
  protected running: boolean = false;
  protected events = new EventEmitter<JobQueueEventListeners<Input, Output>>();
  protected jobProgressListeners: Map<unknown, Set<JobProgressListener>> = new Map();
  protected lastKnownProgress: Map<
    unknown,
    {
      progress: number;
      message: string;
      details: Record<string, any> | null;
    }
  > = new Map();
  protected activeJobPromises: Map<
    unknown,
    Array<{
      resolve: (value?: any) => void;
      reject: (err: JobError) => void;
    }>
  > = new Map();

  constructor(
    queueName: string,
    jobClass: JobClass<Input, Output>,
    storage: IQueueStorage<Input, Output>,
    options: JobQueueOptions<Input, Output> = {}
  ) {
    this.queueName = queueName;
    this.jobClass = jobClass;
    this.storage = storage;
    this.options = {
      waitDurationInMilliseconds: 100,
      ...options,
    };
  }

  /**
   * Start monitoring jobs
   * @param mode Optional mode parameter (unused in client, included for interface compatibility)
   */
  public async start(mode?: any) {
    if (this.running) {
      return this;
    }
    this.running = true;
    this.events.emit("queue_start", this.queueName);
    await this.monitorJobs();
    return this;
  }

  /**
   * Stop monitoring jobs
   */
  public async stop() {
    if (!this.running) return this;
    this.running = false;

    // Reject all waiting promises
    this.activeJobPromises.forEach((promises) =>
      promises.forEach(({ reject }) => reject(new JobError("Client Stopped")))
    );
    this.activeJobPromises.clear();

    this.events.emit("queue_stop", this.queueName);
    return this;
  }

  /**
   * Clear local state (does not affect storage)
   */
  public async clear() {
    this.activeJobPromises.clear();
    this.lastKnownProgress.clear();
    this.jobProgressListeners.clear();
    return this;
  }

  /**
   * Restart the client
   */
  public async restart() {
    await this.stop();
    await this.clear();
    await this.start();
    return this;
  }

  /**
   * Add a job to the queue
   */
  public async add(job: QueueJob) {
    const jobId = await this.storage.add(this.classToStorage(job));
    return jobId;
  }

  /**
   * Get a job by its ID
   */
  public async get(id: unknown) {
    if (!id) throw new JobNotFoundError("Cannot get undefined job");
    const job = await this.storage.get(id);
    if (!job) return undefined;
    return this.storageToClass(job);
  }

  /**
   * Wait for a job to complete
   */
  public async waitFor(jobId: unknown): Promise<Output | undefined> {
    if (!jobId) throw new JobNotFoundError("Cannot wait for undefined job");

    const { promise, resolve, reject } = Promise.withResolvers<Output>();
    promise.catch(() => {});
    const promises = this.activeJobPromises.get(jobId) || [];
    promises.push({ resolve, reject });
    this.activeJobPromises.set(jobId, promises);

    const job = await this.get(jobId);
    if (!job) throw new JobNotFoundError(`Job ${jobId} not found`);

    if (job.status === JobStatus.COMPLETED) {
      return job.output as Output;
    }
    if (job.status === JobStatus.DISABLED) {
      return undefined;
    }
    if (job.status === JobStatus.FAILED) {
      throw this.buildErrorFromJob(job);
    }
    return promise as Promise<Output>;
  }

  /**
   * Abort a job
   */
  public async abort(jobId: unknown) {
    if (!jobId) throw new JobNotFoundError("Cannot abort undefined job");
    await this.storage.abort(jobId);
    this.events.emit("job_aborting", this.queueName, jobId);
  }

  /**
   * Peek at jobs in the queue
   */
  public async peek(status?: JobStatus, num?: number) {
    const jobs = await this.storage.peek(status, num);
    return jobs.map((job) => this.storageToClass(job));
  }

  /**
   * Get the size of the queue
   */
  public async size(status?: JobStatus) {
    return this.storage.size(status);
  }

  /**
   * Get the output for a job by its input
   */
  public async outputForInput(input: Input): Promise<Output | null> {
    if (!input) throw new JobNotFoundError("Cannot get output for undefined input");
    return this.storage.outputForInput(input);
  }

  /**
   * Get jobs by their run ID
   */
  public async getJobsByRunId(jobRunId: string): Promise<Job<Input, Output>[]> {
    if (!jobRunId) throw new JobNotFoundError("Cannot get jobs by undefined runId");
    const jobs = await this.storage.getByRunId(jobRunId);
    return jobs.map((job) => this.storageToClass(job));
  }

  /**
   * Get the stats for the job queue (client-side view only)
   */
  public getStats(): JobQueueStats {
    // Client doesn't track stats, would need to query storage
    return {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      abortedJobs: 0,
      retriedJobs: 0,
      disabledJobs: 0,
      lastUpdateTime: new Date(),
    };
  }

  /**
   * Update the progress of a job (rarely used by client, mostly for testing)
   */
  public async updateProgress(
    jobId: unknown,
    progress: number,
    message: string = "",
    details: Record<string, any> | null = null
  ): Promise<void> {
    const job = await this.get(jobId);
    if (!job) throw new JobNotFoundError(`Job ${jobId} not found`);

    if (
      [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.ABORTING, JobStatus.DISABLED].includes(
        job.status
      )
    ) {
      return;
    }

    progress = Math.max(0, Math.min(100, progress));
    await this.storage.saveProgress(jobId, progress, message, details);
    this.announceProgress(jobId, progress, message, details);
  }

  /**
   * Add a progress listener for a specific job
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

  /**
   * Add one-time event listener
   */
  public once<Event extends JobQueueEvents>(
    event: Event,
    listener: JobQueueEventListener<Event>
  ): void {
    this.events.once(event, listener);
  }

  /**
   * Wait for an event
   */
  public waitOn<Event extends JobQueueEvents>(
    event: Event
  ): Promise<JobQueueEventParameters<Event, Input, Output>> {
    return this.events.waitOn(event) as Promise<JobQueueEventParameters<Event, Input, Output>>;
  }

  // ========================================================================
  // Protected helper methods
  // ========================================================================

  protected buildErrorFromJob(job: Job<Input, Output>): JobError {
    const errorMessage = job.error || "Job failed";
    return new JobError(errorMessage);
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

    this.events.emit("job_progress", this.queueName, jobId, progress, message, details);

    const listeners = this.jobProgressListeners.get(jobId);
    if (listeners) {
      for (const listener of listeners) {
        listener(progress, message, details);
      }
    }
  }

  protected async monitorJobs(): Promise<void> {
    if (!this.running) {
      return;
    }
    try {
      const jobIds = Array.from(this.jobProgressListeners.keys());

      for (const jobId of jobIds) {
        const job = await this.get(jobId);
        if (job) {
          const currentProgress = {
            progress: job.progress,
            message: job.progressMessage,
            details: job.progressDetails || null,
          };

          const lastProgress = this.lastKnownProgress.get(jobId);

          const hasChanged =
            !lastProgress ||
            lastProgress.progress !== currentProgress.progress ||
            lastProgress.message !== currentProgress.message;

          if (hasChanged && currentProgress.progress !== 0 && currentProgress.message !== "") {
            this.announceProgress(
              jobId,
              currentProgress.progress,
              currentProgress.message,
              currentProgress.details
            );
          }

          // Handle completion
          if (job.status === JobStatus.COMPLETED) {
            const promises = this.activeJobPromises.get(jobId);
            if (promises) {
              promises.forEach(({ resolve }) => resolve(job.output!));
              this.activeJobPromises.delete(jobId);
            }
            this.events.emit("job_complete", this.queueName, jobId, job.output!);
          } else if (job.status === JobStatus.FAILED) {
            const promises = this.activeJobPromises.get(jobId);
            if (promises) {
              const error = this.buildErrorFromJob(job);
              promises.forEach(({ reject }) => reject(error));
              this.activeJobPromises.delete(jobId);
            }
            this.events.emit("job_error", this.queueName, jobId, job.error || "Job failed");
          } else if (job.status === JobStatus.DISABLED) {
            const promises = this.activeJobPromises.get(jobId);
            if (promises) {
              promises.forEach(({ resolve }) => resolve(undefined));
              this.activeJobPromises.delete(jobId);
            }
            this.events.emit("job_disabled", this.queueName, jobId);
          }
        }
      }

      for (const jobId of this.lastKnownProgress.keys()) {
        const job = await this.get(jobId);
        if (!job || job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
          this.lastKnownProgress.delete(jobId);
        }
      }
    } catch (error) {
      console.error(`Error in monitorJobs: ${error}`);
    }

    setTimeout(() => this.monitorJobs(), this.options.waitDurationInMilliseconds);
  }

  protected storageToClass(details: any): Job<Input, Output> {
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

  protected classToStorage(job: Job<Input, Output>): any {
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
