//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { getTaskQueueRegistry } from "./TaskQueueRegistry";
import { TaskConfig, TaskOutput, TaskEventListeners, TaskStatus, TaskInput } from "./TaskTypes";
import { SingleTask } from "./SingleTask";
import { EventEmitter } from "@ellmers/util";
import { Job } from "@ellmers/job-queue";

/**
 * Configuration interface for job queue tasks
 */
export interface JobQueueTaskConfig extends TaskConfig {
  queueName?: string;
  currentJobId?: unknown;
  currentJobRunId?: string;
}

/**
 * Configuration interface for job queue tasks with ids
 */
interface JobQueueTaskWithIdsConfig extends JobQueueTaskConfig {
  id: unknown;
}

/**
 * Event listeners for job queue tasks
 */
export type JobQueueTaskEventListeners = Omit<TaskEventListeners, "progress"> & {
  progress: (progress: number, message: string, details: Record<string, any> | null) => void;
};

/**
 * Base class for job queue tasks
 */
export abstract class JobQueueTask extends SingleTask {
  static readonly type: string = "JobQueueTask";
  static canRunDirectly = true;

  public jobClass: any;

  declare config: JobQueueTaskWithIdsConfig;
  public events = new EventEmitter<JobQueueTaskEventListeners>();

  constructor(config: JobQueueTaskConfig) {
    super(config);
    this.jobClass = Job<TaskInput, TaskOutput>;
  }

  private abortController: AbortController | undefined;

  async run(): Promise<TaskOutput> {
    this.handleStart();

    let cleanup: () => void = () => {};

    try {
      if (this.status === TaskStatus.ABORTING) {
        throw new Error("Task aborted by run time");
      }

      const job = await this.createJob();

      const queue = getTaskQueueRegistry().getQueue(this.config.queueName!);

      if (!queue) {
        if ((this.constructor as typeof JobQueueTask).canRunDirectly) {
          this.abortController = new AbortController();
          cleanup = job.onJobProgress(
            (progress: number, message: string, details: Record<string, any> | null) => {
              this.handleProgress(progress, message, details);
            }
          );
          this.runOutputData = await job.execute(this.abortController.signal);
        } else {
          throw new Error(
            `Queue ${this.config.queueName} not found, and ${this.constructor.name} cannot run directly`
          );
        }
      } else {
        const jobId = await queue.add(job);
        this.config.currentJobRunId = job.jobRunId; // no longer undefined
        this.config.currentJobId = jobId;

        const cleanup = queue.onJobProgress(jobId, (progress, message, details) => {
          this.handleProgress(progress, message, details);
        });
        this.runOutputData = await queue.waitFor(jobId);
      }

      this.runOutputData ??= {};
      this.runOutputData = await this.runReactive();

      this.handleComplete();
      return this.runOutputData;
    } catch (err: any) {
      this.handleError(err);
      console.error(err);
      throw err;
    } finally {
      this.abortController = undefined;
      cleanup();
    }
  }

  handleProgress(progress: number, ...args: any[]): void {
    this.progress = progress;
    const message = args.shift();
    const details = args.shift();
    this.events.emit("progress", progress, message, details);
  }

  /**
   * Override this method to create the right job class for the queue for this task
   * @returns Promise<Job> - The created job
   */
  async createJob() {
    const queue = getTaskQueueRegistry().getQueue(this.config.queueName!);
    if (!queue) {
      if ((this.constructor as typeof JobQueueTask).canRunDirectly) {
        return new this.jobClass({
          queueName: this.config.queueName,
          jobRunId: this.config.currentJobRunId, // could be undefined
          input: this.runInputData,
        });
      } else {
        throw new Error("Queue not found");
      }
    }
    const job = new queue.jobClass({
      queueName: queue.queueName,
      jobRunId: this.config.currentJobRunId, // could be undefined
      input: this.runInputData,
    });
    return job;
  }

  /**
   * Aborts the task
   * @returns A promise that resolves when the task is aborted
   */
  async abort(): Promise<void> {
    // Direct running jobs
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
    }
    // Queue running jobs
    if (this.config.queueName) {
      const queue = getTaskQueueRegistry().getQueue(this.config.queueName);
      if (queue) {
        await queue.abort(this.config.currentJobId);
      }
    }
    super.abort();
  }
}
