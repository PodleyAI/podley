//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { globalServiceRegistry } from "@ellmers/util";
import { TASK_OUTPUT_REPOSITORY, TaskOutputRepository } from "../storage/TaskOutputRepository";
import { IRunConfig, ITask } from "./ITask";
import { ITaskRunner } from "./ITaskRunner";
import { TaskAbortedError, TaskError, TaskFailedError, TaskInvalidInputError } from "./TaskError";
import { Provenance, TaskConfig, TaskInput, TaskOutput, TaskStatus } from "./TaskTypes";

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
  async run(overrides: Partial<Input> = {}, config: IRunConfig = {}): Promise<Output> {
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
      this.outputCache = this.task.config.outputCache;
      this.task.setInput(overrides);
      const isValid = await this.task.validateInput(this.task.runInputData);
      if (!isValid) {
        throw new TaskInvalidInputError("Invalid input data");
      }

      if (this.abortController?.signal.aborted) {
        await this.handleAbort();
        throw new TaskAbortedError("Promise for task created and aborted before run");
      }

      const result = await this.executeTask(this.task.runInputData);

      this.task.runOutputData = result ?? ({} as Output);

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
    if (this.task.status === TaskStatus.PROCESSING) {
      return this.task.runOutputData;
    }
    this.task.setInput(overrides);

    await this.handleStartReactive();

    try {
      const isValid = await this.task.validateInput(this.task.runInputData);
      if (!isValid) {
        throw new TaskInvalidInputError("Invalid input data");
      }

      const resultReactive = await this.executeTaskReactive(
        this.task.runInputData,
        this.task.runOutputData
      );

      this.task.runOutputData = (resultReactive ?? {}) as Output;

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
  protected async executeTask(input: Input): Promise<Output | undefined> {
    const result = await this.task.execute(input, {
      signal: this.abortController!.signal,
      updateProgress: this.handleProgress.bind(this),
      nodeProvenance: this.nodeProvenance,
    });
    const reactiveResult = await this.task.executeReactive(input, result || ({} as Output));
    return (
      Object.keys(reactiveResult || {}) >= Object.keys(result || {})
        ? reactiveResult
        : (result ?? {})
    ) as Output;
  }

  /**
   * Protected method for reactive execution delegation
   */
  protected async executeTaskReactive(input: Input, output: Output): Promise<Output | undefined> {
    return this.task.executeReactive(input, output);
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
  protected async handleAbort(): Promise<void> {
    if (this.task.status === TaskStatus.ABORTING) return;
    this.task.status = TaskStatus.ABORTING;
    this.task.progress = 100;
    this.task.error = new TaskAbortedError();
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

  protected async handleSkip(): Promise<void> {
    if (this.task.status === TaskStatus.SKIPPED) return;
    this.task.status = TaskStatus.SKIPPED;
    this.task.progress = 100;
    this.task.completedAt = new Date();
    this.abortController = undefined;
    this.nodeProvenance = {};
    this.task.emit("skipped");
  }

  public async skip(): Promise<void> {
    await this.handleSkip();
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
