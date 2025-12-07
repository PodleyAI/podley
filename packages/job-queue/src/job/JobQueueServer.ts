/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { IQueueStorage } from "@workglow/storage";
import { EventEmitter } from "@workglow/util";
import { Job, JobConstructorParam } from "./Job";
import { JobQueueOptions, JobStatus, QueueMode } from "./IJobQueue";
import {
  JobQueueEventListener,
  JobQueueEventListeners,
  JobQueueEvents,
  JobProgressListener,
} from "./JobQueueEventListeners";
import { JobQueueStats } from "./JobQueue";
import { JobQueueWorker } from "./JobQueueWorker";

type JobClass<Input, Output> = new (
  param: JobConstructorParam<Input, Output>
) => Job<Input, Output>;

/**
 * Server for coordinating multiple workers and managing the job queue.
 * Typically runs as a separate service that manages workers.
 */
export class JobQueueServer<
  Input,
  Output,
  QueueJob extends Job<Input, Output> = Job<Input, Output>
> {
  public readonly queueName: string;
  public readonly jobClass: JobClass<Input, Output>;
  protected readonly storage: IQueueStorage<Input, Output>;
  protected options: JobQueueOptions<Input, Output>;
  protected running: boolean = false;
  protected events = new EventEmitter<JobQueueEventListeners<Input, Output>>();
  protected workers: JobQueueWorker<Input, Output, QueueJob>[] = [];
  protected workerCount: number;

  constructor(
    queueName: string,
    jobClass: JobClass<Input, Output>,
    storage: IQueueStorage<Input, Output>,
    options: JobQueueOptions<Input, Output> & { workerCount?: number } = {}
  ) {
    this.queueName = queueName;
    this.jobClass = jobClass;
    this.storage = storage;
    const { workerCount = 1, ...rest } = options;
    this.workerCount = workerCount;
    this.options = {
      waitDurationInMilliseconds: 100,
      ...rest,
    };
  }

  /**
   * Start the server and its workers
   * @param mode Optional mode parameter (unused in server, included for interface compatibility)
   */
  public async start(mode?: QueueMode) {
    if (this.running) {
      return this;
    }
    this.running = true;
    this.events.emit("queue_start", this.queueName);

    // Create and start workers
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new JobQueueWorker<Input, Output, QueueJob>(
        this.queueName,
        this.jobClass,
        this.storage,
        this.options
      );

      // Forward worker events to server events
      worker.on("job_start", (queueName, jobId) => {
        this.events.emit("job_start", queueName, jobId);
      });
      worker.on("job_complete", (queueName, jobId, output) => {
        this.events.emit("job_complete", queueName, jobId, output);
      });
      worker.on("job_error", (queueName, jobId, error) => {
        this.events.emit("job_error", queueName, jobId, error);
      });
      worker.on("job_retry", (queueName, jobId, runAfter) => {
        this.events.emit("job_retry", queueName, jobId, runAfter);
      });
      worker.on("job_disabled", (queueName, jobId) => {
        this.events.emit("job_disabled", queueName, jobId);
      });
      worker.on("job_aborting", (queueName, jobId) => {
        this.events.emit("job_aborting", queueName, jobId);
      });
      worker.on("queue_stats_update", (queueName, stats) => {
        this.events.emit("queue_stats_update", queueName, stats);
      });

      await worker.start();
      this.workers.push(worker);
    }

    return this;
  }

  /**
   * Stop the server and all workers
   */
  public async stop() {
    if (!this.running) return this;
    this.running = false;

    // Stop all workers
    await Promise.all(this.workers.map((worker) => worker.stop()));
    this.workers = [];

    this.events.emit("queue_stop", this.queueName);
    return this;
  }

  /**
   * Clear all workers
   */
  public async clear() {
    await Promise.all(this.workers.map((worker) => worker.clear()));
    return this;
  }

  /**
   * Restart the server
   */
  public async restart() {
    await this.stop();
    await this.clear();
    await this.start();
    return this;
  }

  /**
   * Get aggregated statistics from all workers
   */
  public getStats(): JobQueueStats {
    const aggregated: JobQueueStats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      abortedJobs: 0,
      retriedJobs: 0,
      disabledJobs: 0,
      lastUpdateTime: new Date(),
    };

    let totalProcessingTime = 0;
    let workerCountWithTime = 0;

    for (const worker of this.workers) {
      const stats = worker.getStats();
      aggregated.totalJobs += stats.totalJobs;
      aggregated.completedJobs += stats.completedJobs;
      aggregated.failedJobs += stats.failedJobs;
      aggregated.abortedJobs += stats.abortedJobs;
      aggregated.retriedJobs += stats.retriedJobs;
      aggregated.disabledJobs += stats.disabledJobs;

      if (stats.averageProcessingTime !== undefined) {
        totalProcessingTime += stats.averageProcessingTime;
        workerCountWithTime++;
      }

      if (stats.lastUpdateTime > aggregated.lastUpdateTime) {
        aggregated.lastUpdateTime = stats.lastUpdateTime;
      }
    }

    if (workerCountWithTime > 0) {
      aggregated.averageProcessingTime = totalProcessingTime / workerCountWithTime;
    }

    return aggregated;
  }

  /**
   * Get the number of workers
   */
  public getWorkerCount(): number {
    return this.workers.length;
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
}
