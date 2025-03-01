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
import { TaskConfigurationError } from "./TaskError";

/**
 * Configuration interface for job queue tasks
 */
export interface JobQueueTaskConfig extends TaskConfig {
  queueName?: string;
  currentJobId?: unknown;
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
  declare events: EventEmitter<JobQueueTaskEventListeners>;

  constructor(config: JobQueueTaskConfig) {
    super(config);
    this.jobClass = Job<TaskInput, TaskOutput>;
  }

  async runFull(): Promise<TaskOutput> {
    let cleanup: () => void = () => {};

    try {
      const job = await this.createJob();

      const queue = getTaskQueueRegistry().getQueue(this.config.queueName!);

      if (!queue) {
        if ((this.constructor as typeof JobQueueTask).canRunDirectly) {
          cleanup = job.onJobProgress(
            (progress: number, message: string, details: Record<string, any> | null) => {
              this.handleProgress(progress, message, details);
            }
          );
          this.runOutputData = await job.execute(this.abortController!.signal);
        } else {
          throw new TaskConfigurationError(
            `Queue ${this.config.queueName} not found, and ${this.constructor.name} cannot run directly`
          );
        }
      } else {
        const jobId = await queue.add(job);
        this.config.currentJobId = jobId;
        // this.config.runnerId = job.jobRunId; // ??

        cleanup = queue.onJobProgress(jobId, (progress, message, details) => {
          this.handleProgress(progress, message, details);
        });
        this.runOutputData = await queue.waitFor(jobId);
      }

      this.runOutputData ??= {};
      this.runOutputData = await this.runReactive();

      return this.runOutputData;
    } catch (err: any) {
      throw err;
    } finally {
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
          jobRunId: this.config.runnerId, // could be undefined
          input: this.runInputData,
        });
      } else {
        throw new TaskConfigurationError("Queue not found");
      }
    }
    const job = new queue.jobClass({
      queueName: queue.queueName,
      jobRunId: this.config.runnerId, // could be undefined
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
