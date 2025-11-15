//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Job, JobConstructorParam, JobQueue } from "@podley/job-queue";
import { ArrayTask } from "./ArrayTask";
import { IExecuteContext } from "./ITask";
import { getJobQueueFactory } from "./JobQueueFactory";
import { JobTaskFailedError, TaskConfigurationError } from "./TaskError";
import { TaskEventListeners } from "./TaskEvents";
import { getTaskQueueRegistry } from "./TaskQueueRegistry";
import { TaskConfig, TaskInput, TaskOutput } from "./TaskTypes";

/**
 * Configuration interface for JobQueueTask.
 * Extends the base TaskConfig with job queue specific properties.
 */
export interface JobQueueTaskConfig extends TaskConfig {
  /**
   * Queue selection for the task
   * - `true` (default): create/use the task's default queue
   * - `false`: run directly without queueing (requires `canRunDirectly`)
   * - `string`: use an explicitly registered queue name
   */
  queue?: boolean | string;
}

/**
 * Extended event listeners for JobQueueTask.
 * Adds progress event handling to base task event listeners.
 */
export type JobQueueTaskEventListeners = Omit<TaskEventListeners, "progress"> & {
  progress: (progress: number, message?: string, details?: Record<string, any> | null) => void;
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
> extends ArrayTask<Input, Output, Config> {
  static readonly type: string = "JobQueueTask";
  static canRunDirectly = true;

  /** Name of the queue currently processing the task */
  currentQueueName?: string;
  /** ID of the current job being processed */
  currentJobId?: string | unknown;
  /** ID of the current runner being used */
  currentRunnerId?: string;

  public jobClass: new (config: JobConstructorParam<Input, Output>) => Job<Input, Output>;

  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    config.queue ??= true;
    super(input, config);
    this.jobClass = Job as unknown as new (
      config: JobConstructorParam<Input, Output>
    ) => Job<Input, Output>;
  }

  async execute(input: Input, executeContext: IExecuteContext): Promise<Output | undefined> {
    let cleanup: () => void = () => {};

    try {
      if (
        this.config.queue === false &&
        !(this.constructor as typeof JobQueueTask).canRunDirectly
      ) {
        throw new TaskConfigurationError(`${this.type} cannot run directly without a queue`);
      }

      const queue = await this.resolveQueue(input);
      const job = await this.createJob(input, queue);

      if (!queue) {
        if (!(this.constructor as typeof JobQueueTask).canRunDirectly) {
          const queueLabel =
            typeof this.config.queue === "string"
              ? this.config.queue
              : (this.currentQueueName ?? this.type);
          throw new TaskConfigurationError(
            `Queue ${queueLabel} not found, and ${this.type} cannot run directly`
          );
        }
        this.currentJobId = undefined;
        cleanup = job.onJobProgress(
          (progress: number, message: string, details: Record<string, any> | null) => {
            executeContext.updateProgress(progress, message, details);
          }
        );
        const output = await job.execute(job.input, {
          signal: executeContext.signal,
          updateProgress: executeContext.updateProgress.bind(this),
        });
        return output;
      }

      const jobId = await queue.add(job);
      this.currentJobId = jobId;
      this.currentQueueName = queue?.queueName;
      this.currentRunnerId = job.jobRunId;
      cleanup = queue.onJobProgress(jobId, (progress, message, details) => {
        executeContext.updateProgress(progress, message, details);
      });
      const output = await queue.waitFor(jobId);
      if (output === undefined) {
        throw new TaskConfigurationError("Job skipped, should not happen");
      }

      return output!;
    } catch (err: any) {
      throw new JobTaskFailedError(err);
    } finally {
      cleanup();
    }
  }

  /**
   * Override this method to create the right job class for the queue for this task
   * @returns Promise<Job> - The created job
   */
  async createJob(input: Input, queue?: JobQueue<any, any>): Promise<Job<any, any>> {
    const jobCtor = queue?.jobClass ?? this.jobClass;
    return new jobCtor({
      queueName: queue?.queueName ?? this.currentQueueName,
      jobRunId: this.currentRunnerId, // could be undefined
      input: input,
    });
  }

  protected async resolveQueue(input: Input): Promise<JobQueue<Input, Output> | undefined> {
    const preference = this.config.queue ?? true;

    if (preference === false) {
      this.currentQueueName = undefined;
      return undefined;
    }

    if (typeof preference === "string") {
      const queue = getTaskQueueRegistry().getQueue<Input, Output>(preference);
      if (queue) {
        this.currentQueueName = queue.queueName;
        return queue;
      }
      this.currentQueueName = preference;
      return undefined;
    }

    const queueName = await this.getDefaultQueueName(input);
    if (!queueName) {
      this.currentQueueName = undefined;
      return undefined;
    }

    this.currentQueueName = queueName;

    let queue = getTaskQueueRegistry().getQueue<Input, Output>(queueName);
    if (!queue) {
      queue = await this.createAndRegisterQueue(queueName, input);
      await queue.start();
    }

    return queue;
  }

  protected async getDefaultQueueName(_input: Input): Promise<string | undefined> {
    return this.type;
  }

  protected async createAndRegisterQueue(
    queueName: string,
    input: Input
  ): Promise<JobQueue<Input, Output>> {
    const factory = getJobQueueFactory();
    let queue = await factory({
      queueName,
      jobClass: this.jobClass,
      input,
      config: this.config,
      task: this,
    });

    const registry = getTaskQueueRegistry();

    try {
      registry.registerQueue(queue);
    } catch (err) {
      if (err instanceof Error && err.message.includes("already exists")) {
        const existing = registry.getQueue<Input, Output>(queueName);
        if (existing) {
          queue = existing;
        }
      } else {
        throw err;
      }
    }

    return queue;
  }

  /**
   * Aborts the task
   * @returns A promise that resolves when the task is aborted
   */
  async abort(): Promise<void> {
    if (this.currentQueueName) {
      const queue = getTaskQueueRegistry().getQueue(this.currentQueueName);
      if (queue) {
        await queue.abort(this.currentJobId);
      }
    }
    // Always call the parent abort to ensure the task is properly marked as aborted
    super.abort();
  }
}
