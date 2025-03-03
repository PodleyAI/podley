//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { getTaskQueueRegistry } from "./TaskQueueRegistry";
import { TaskConfig, TaskOutput, TaskInput } from "./TaskTypes";
import { TaskEventListeners } from "./TaskEvents";
import { EventEmitter } from "@ellmers/util";
import { Job } from "@ellmers/job-queue";
import { TaskConfigurationError } from "./TaskError";
import { Task } from "./Task";

/**
 * Configuration interface for JobQueueTask.
 * Extends the base TaskConfig with job queue specific properties.
 */
export interface JobQueueTaskConfig extends TaskConfig {
  /** Name of the queue to use for this task */
  queueName?: string;
  /** ID of the current job being processed */
  currentJobId?: string | unknown;
}

/**
 * Extended event listeners for JobQueueTask.
 * Adds progress event handling to base task event listeners.
 */
export type JobQueueTaskEventListeners = Omit<TaskEventListeners, "progress"> & {
  progress: (progress: number, message: string, details: Record<string, any> | null) => void;
};

/**
 * Abstract base class for tasks that operate within a job queue.
 * Provides functionality for managing job execution, progress tracking, and queue integration.
 *
 * @template Input - Type of input data for the task
 * @template Output - Type of output data produced by the task
 * @template Config - Type of configuration object for the task
 */
export abstract class JobQueueTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends JobQueueTaskConfig = JobQueueTaskConfig,
> extends Task<Input, Output, Config> {
  static readonly type: string = "JobQueueTask";
  static canRunDirectly = true;

  public jobClass: any;

  declare events: EventEmitter<JobQueueTaskEventListeners>;

  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    super(input, config);
    this.jobClass = Job<Input, Output>;
  }

  async runFull(): Promise<Output> {
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
        this.runOutputData = await queue.waitFor<Output>(jobId);
      }

      this.runOutputData ??= {} as Output;
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
