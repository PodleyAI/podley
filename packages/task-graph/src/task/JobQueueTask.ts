//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { getTaskQueueRegistry } from "./TaskQueueRegistry";
import { TaskConfig, TaskOutput, TaskEventListeners, TaskStatus } from "./Task";
import { SingleTask } from "./SingleTask";
import { EventEmitter } from "@ellmers/util";

/**
 * Configuration interface for job queue tasks
 */
export interface JobQueueTaskConfig extends TaskConfig {
  queue?: string;
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
  declare config: JobQueueTaskWithIdsConfig;
  public events = new EventEmitter<JobQueueTaskEventListeners>();

  constructor(config: JobQueueTaskConfig) {
    super(config);
  }

  async run(): Promise<TaskOutput> {
    if (this.status === TaskStatus.ABORTING) {
      throw new Error("Task aborted by run time");
    }

    this.handleStart();
    this.runOutputData = {};

    try {
      if (!(await this.validateInputData(this.runInputData))) {
        throw new Error("Invalid input data");
      }
      const job = await this.createJob();

      const queue = getTaskQueueRegistry().getQueue(this.config.queue!);
      if (!queue) {
        throw new Error("Queue not found");
      }

      const jobId = await queue.add(job);
      this.config.currentJobRunId = job.jobRunId; // no longer undefined
      this.config.currentJobId = jobId;

      const cleanup = queue.onJobProgress(jobId, (progress, message, details) => {
        this.events.emit("progress", progress, message, details);
      });
      this.runOutputData = await queue.waitFor(jobId);
      cleanup();

      this.runOutputData ??= {};
      this.runOutputData = await this.runReactive();

      this.handleComplete();
      return this.runOutputData;
    } catch (err: any) {
      this.handleError(err);
      console.error(err);
      throw err;
    }
  }

  /**
   * Override this method to create the right job class for the queue for this task
   * @returns Promise<Job> - The created job
   */
  async createJob() {
    const queue = getTaskQueueRegistry().getQueue(this.config.queue!);
    if (!queue) {
      throw new Error("Queue not found");
    }
    const job = new queue.jobClass({
      queueName: queue.queue,
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
    if (this.config.queue) {
      const queue = getTaskQueueRegistry().getQueue(this.config.queue);
      if (queue) {
        await queue.abort(this.config.currentJobId);
      }
    }
    super.abort();
  }
}
