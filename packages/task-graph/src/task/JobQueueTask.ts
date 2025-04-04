//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Job } from "@ellmers/job-queue";
import { EventEmitter } from "@ellmers/util";
import { IExecuteConfig } from "./ITask";
import { RunOrReplicateTask } from "./RunOrReplicateTask";
import { TaskConfigurationError } from "./TaskError";
import { TaskEventListeners } from "./TaskEvents";
import { getTaskQueueRegistry } from "./TaskQueueRegistry";
import { TaskConfig, TaskInput, TaskOutput } from "./TaskTypes";

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
> extends RunOrReplicateTask<Input, Output, Config> {
  static readonly type: string = "JobQueueTask";
  static canRunDirectly = true;

  public jobClass: any;

  declare events: EventEmitter<JobQueueTaskEventListeners>;

  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    super(input, config);
    this.jobClass = Job<Input, Output>;
  }

  async execute(input: Input, executeConfig: IExecuteConfig): Promise<Output> {
    let cleanup: () => void = () => {};

    try {
      executeConfig.updateProgress(0.009, "Creating job");
      const job = await this.createJob(input);

      const queue = getTaskQueueRegistry().getQueue(this.config.queueName!);

      let output: Output | undefined;

      if (!queue) {
        if ((this.constructor as typeof JobQueueTask).canRunDirectly) {
          cleanup = job.onJobProgress(
            (progress: number, message: string, details: Record<string, any> | null) => {
              executeConfig.updateProgress(progress, message, details);
            }
          );
          output = await job.execute(executeConfig.signal);
        } else {
          throw new TaskConfigurationError(
            `Queue ${this.config.queueName} not found, and ${this.constructor.name} cannot run directly`
          );
        }
      } else {
        const jobId = await queue.add(job);
        this.config.currentJobId = jobId;
        this.config.runnerId = job.jobRunId; // TODO: think about this more
        cleanup = queue.onJobProgress(jobId, (progress, message, details) => {
          executeConfig.updateProgress(progress, message, details);
        });
        output = await queue.waitFor<Output>(jobId);
        if (output === undefined) {
          throw new TaskConfigurationError("Job skipped, should not happen");
        }
      }

      return output!;
    } catch (err: any) {
      throw err;
    } finally {
      cleanup();
    }
  }

  /**
   * Override this method to create the right job class for the queue for this task
   * @returns Promise<Job> - The created job
   */
  async createJob(input: Input) {
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
      input: input,
    });
    return job;
  }

  /**
   * Aborts the task
   * @returns A promise that resolves when the task is aborted
   */
  async abort(): Promise<void> {
    if (this.config.queueName) {
      const queue = getTaskQueueRegistry().getQueue(this.config.queueName);
      if (queue) {
        await queue.abort(this.config.currentJobId);
      }
    }
    // Always call the parent abort to ensure the task is properly marked as aborted
    super.abort();
  }
}
