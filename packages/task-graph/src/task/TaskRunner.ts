//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskOutputRepository, TASK_OUTPUT_REPOSITORY } from "../storage/TaskOutputRepository";
import { ITask, IRunConfig } from "./ITask";
import { ITaskRunner } from "./ITaskRunner";
import { TaskAbortedError, TaskError, TaskFailedError, TaskInvalidInputError } from "./TaskError";
import { TaskInput, TaskOutput, TaskConfig, TaskStatus, Provenance } from "./TaskTypes";
import { AnyGraphResult } from "../task-graph/TaskGraphRunner";
import { globalServiceRegistry } from "@ellmers/util";

/**
 * Responsible for running tasks
 * Manages the execution lifecycle of individual tasks
 */
export class TaskRunner<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> implements ITaskRunner<Input, Output, Config>
{
  /**
   * Whether the task is currently running
   */
  protected running = false;
  protected reactiveRunning = false;

  /**
   * Provenance information for the task
   */
  protected nodeProvenance: Provenance = {};

  /**
   * The task to run
   */
  public readonly task: ITask<Input, Output, Config>;

  /**
   * Output cache repository
   */
  protected outputCache?: TaskOutputRepository;

  /**
   * AbortController for cancelling task execution
   */
  protected abortController?: AbortController;

  /**
   * Constructor for TaskRunner
   * @param task The task to run
   * @param outputCache Optional output cache repository
   */
  constructor(task: ITask<Input, Output, Config>, outputCache?: TaskOutputRepository) {
    this.task = task;
    this.outputCache = outputCache;
  }

  // ========================================================================
  // Public methods
  // ========================================================================

  /**
   * Runs the task and returns the output
   * @param overrides Optional input overrides
   * @param config Optional configuration overrides
   * @returns The task output
   */
  async run(
    overrides: Partial<Input> = {},
    config: IRunConfig = {}
  ): Promise<AnyGraphResult<Output>> {
    await this.handleStart();

    this.nodeProvenance = config.nodeProvenance ?? {};

    if (config.outputCache === true) {
      let instance = globalServiceRegistry.get(TASK_OUTPUT_REPOSITORY);
      this.outputCache = instance;
    } else if (config.outputCache === false) {
      this.outputCache = undefined;
    } else {
      this.outputCache = config.outputCache;
    }

    try {
      this.task.setInput(overrides);
      const isValid = await this.task.validateInput(this.task.runInputData);
      if (!isValid) {
        throw new TaskInvalidInputError("Invalid input data");
      }

      if (this.abortController?.signal.aborted) {
        await this.handleAbort();
        throw new TaskAbortedError("Promise for task created and aborted before run");
      }

      // Execute the task's functionality
      let results: AnyGraphResult<Output> | undefined;

      if (this.task.hasChildren()) {
        // For compound tasks, run the subgraph
        results = await this.executeTaskChildren();
      } else {
        // For simple tasks, we call the task's execute method
        results = await this.executeTask();
      }

      if (results && Object.keys(results).length > 0) {
        this.task.runOutputData = results as Output;
      } else {
        this.task.runOutputData = this.task.runOutputData || ({} as Output);
      }

      this.outputCache = this.task.config.outputCache;

      if (!this.task.hasChildren()) {
        results = await this.executeTaskReactive();
        if (results && Object.keys(results).length > 0) {
          this.task.runOutputData = results as Output;
        }
      }

      await this.handleComplete();

      return this.task.runOutputData;
    } catch (err: any) {
      await this.handleError(err);
      throw err;
    }
  }

  /**
   * Runs the task in reactive mode
   * @param overrides Optional input overrides
   * @returns The task output
   */
  public async runReactive(overrides: Partial<Input> = {}): Promise<Output> {
    this.task.setInput(overrides);
    if (this.task.status === TaskStatus.PROCESSING) {
      return this.task.runOutputData;
    }

    await this.handleStartReactive();

    try {
      const isValid = await this.task.validateInput(this.task.runInputData);
      if (!isValid) {
        throw new TaskInvalidInputError("Invalid input data");
      }

      let results: AnyGraphResult<Output> | undefined;

      if (this.task.hasChildren()) {
        results = await this.executeTaskChildrenReactive();
        if (results && Object.keys(results).length > 0) {
          this.task.runOutputData = results as Output;
        }
      } else {
        results = await this.executeTaskReactive();
        if (results && Object.keys(results).length > 0) {
          this.task.runOutputData = results as Output;
        }
      }

      await this.handleCompleteReactive();
      return this.task.runOutputData;
    } catch (err: any) {
      await this.handleErrorReactive();
      throw err;
    }
  }

  /**
   * Aborts task execution
   */
  public abort(): void {
    this.abortController?.abort();
  }

  // ========================================================================
  // Protected methods
  // ========================================================================

  /**
   * Protected method to execute a task by delegating back to the task itself.
   */
  protected async executeTask(): Promise<AnyGraphResult<Output> | undefined> {
    return this.task.execute(this.task.runInputData, {
      signal: this.abortController!.signal,
      updateProgress: this.handleProgress.bind(this),
      nodeProvenance: this.nodeProvenance,
    });
  }

  /**
   * Protected method to execute a task subgraphby delegating back to the task itself.
   */
  protected async executeTaskChildren(): Promise<AnyGraphResult<Output> | undefined> {
    return this.task.subGraph!.run<Output>({
      parentProvenance: this.nodeProvenance || {},
      parentSignal: this.abortController?.signal,
      outputCache: this.outputCache,
      compoundMerge: this.task.compoundMerge,
    });
  }

  /**
   * Protected method for reactive execution delegation
   */
  protected async executeTaskReactive(): Promise<AnyGraphResult<Output> | undefined> {
    return this.task.executeReactive(this.task.runInputData, this.task.runOutputData);
  }

  /**
   * Protected method for reactive execution delegation
   */
  protected async executeTaskChildrenReactive(): Promise<AnyGraphResult<Output> | undefined> {
    return this.task.subGraph!.runReactive<Output>();
  }

  // ========================================================================
  // Protected Handlers
  // ========================================================================

  /**
   * Handles task start
   */
  protected async handleStart(): Promise<void> {
    if (this.task.status === TaskStatus.PROCESSING) return;

    this.nodeProvenance = {};
    this.running = true;

    this.task.startedAt = new Date();
    this.task.progress = 0;
    this.task.status = TaskStatus.PROCESSING;

    this.abortController = new AbortController();
    this.abortController.signal.addEventListener("abort", () => {
      this.handleAbort();
    });

    this.task.emit("start");
  }

  protected async handleStartReactive(): Promise<void> {
    this.reactiveRunning = true;
  }

  /**
   * Handles task abort
   */
  public async handleAbort(): Promise<void> {
    if (this.task.status === TaskStatus.ABORTING) return;
    this.task.status = TaskStatus.ABORTING;
    this.task.progress = 100;
    this.task.error = new TaskAbortedError();
    if (this.task.isCompound) {
      this.task.subGraph?.abort();
    }
    this.task.emit("abort", this.task.error);
  }

  protected async handleAbortReactive(): Promise<void> {
    this.reactiveRunning = false;
  }

  /**
   * Handles task completion
   */
  protected async handleComplete(): Promise<void> {
    if (this.task.status === TaskStatus.COMPLETED) return;

    this.task.completedAt = new Date();
    this.task.progress = 100;
    this.task.status = TaskStatus.COMPLETED;
    this.abortController = undefined;
    this.nodeProvenance = {};

    this.task.emit("complete");
  }

  protected async handleCompleteReactive(): Promise<void> {
    this.reactiveRunning = false;
  }

  /**
   * Handles task error
   * @param err Error that occurred
   */
  protected async handleError(err: Error): Promise<void> {
    if (err instanceof TaskAbortedError) return this.handleAbort();
    if (this.task.status === TaskStatus.FAILED) return;

    this.task.completedAt = new Date();
    this.task.progress = 100;
    this.task.status = TaskStatus.FAILED;
    this.task.error =
      err instanceof TaskError ? err : new TaskFailedError(err?.message || "Task failed");
    this.abortController = undefined;
    this.nodeProvenance = {};
    if (this.task.hasChildren()) {
      this.task.subGraph!.abort();
    }
    this.task.emit("error", this.task.error);
  }

  protected async handleErrorReactive(): Promise<void> {
    this.reactiveRunning = false;
  }

  /**
   * Handles task progress update
   * @param progress Progress value (0-100)
   * @param args Additional arguments
   */
  protected handleProgress(progress: number, ...args: any[]): void {
    this.task.progress = progress;
    this.task.emit("progress", progress, ...args);
  }
}
