//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { globalServiceRegistry } from "@ellmers/util";
import { TASK_OUTPUT_REPOSITORY, TaskOutputRepository } from "../storage/TaskOutputRepository";
import { ITaskGraph } from "../task-graph/ITaskGraph";
import { IWorkflow } from "../task-graph/IWorkflow";
import { TaskGraph } from "../task-graph/TaskGraph";
import { ensureTask, type Taskish } from "../task-graph/Conversions";
import { IRunConfig, ITask } from "./ITask";
import { ITaskRunner } from "./ITaskRunner";
import { Task } from "./Task";
import { TaskAbortedError, TaskError, TaskFailedError, TaskInvalidInputError } from "./TaskError";
import { Provenance, TaskConfig, TaskInput, TaskOutput, TaskStatus } from "./TaskTypes";
import { GraphAsTask } from "../task/GraphAsTask";
import { Workflow } from "../task-graph/Workflow";

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
   * AbortController for cancelling task execution
   */
  protected abortController?: AbortController;

  /**
   * The output cache for the task
   */
  protected outputCache?: TaskOutputRepository;

  /**
   * Constructor for TaskRunner
   * @param task The task to run
   */
  constructor(task: ITask<Input, Output, Config>) {
    this.task = task;
    this.own = this.own.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
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
    await this.handleStart(config);

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

      const inputs = this.task.runInputData;
      let outputs: Output | undefined;
      if (this.task.cacheable) {
        outputs = (await this.outputCache?.getOutput(this.task.type, inputs)) as Output;
        if (outputs) {
          this.task.runOutputData = await this.executeTaskReactive(inputs, outputs);
        }
      }
      if (!outputs) {
        outputs = await this.executeTask(inputs);
        if (this.task.cacheable && outputs !== undefined) {
          await this.outputCache?.saveOutput(this.task.type, inputs, outputs);
        }
        this.task.runOutputData = outputs ?? ({} as Output);
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

      this.task.runOutputData = resultReactive;

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
    if (this.task.hasChildren()) {
      this.task.subGraph.abort();
    }
    this.abortController?.abort();
  }

  // ========================================================================
  // Protected methods
  // ========================================================================

  protected own<T extends Taskish<any, any>>(i: T): T {
    const task = ensureTask(i, { isOwned: true });
    this.task.subGraph.addTask(task);
    return i;
  }

  /**
   * Protected method to execute a task by delegating back to the task itself.
   */
  protected async executeTask(input: Input): Promise<Output | undefined> {
    const result = await this.task.execute(input, {
      signal: this.abortController!.signal,
      updateProgress: this.handleProgress,
      nodeProvenance: this.nodeProvenance,
      own: this.own,
    });
    return await this.executeTaskReactive(input, result || ({} as Output));
  }

  /**
   * Protected method for reactive execution delegation
   */
  protected async executeTaskReactive(input: Input, output: Output): Promise<Output> {
    const reactiveResult = await this.task.executeReactive(input, output, { own: this.own });
    return (
      Object.keys(reactiveResult || {}) >= Object.keys(output || {})
        ? reactiveResult
        : (output ?? {})
    ) as Output;
  }

  // ========================================================================
  // Protected Handlers
  // ========================================================================

  /**
   * Handles task start
   */
  protected async handleStart(config: IRunConfig = {}): Promise<void> {
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

    this.nodeProvenance = config.nodeProvenance ?? {};

    const cache = this.task.config.outputCache ?? config.outputCache;
    if (cache === true) {
      let instance = globalServiceRegistry.get(TASK_OUTPUT_REPOSITORY);
      this.outputCache = instance;
    } else if (cache === false) {
      this.outputCache = undefined;
    } else if (cache instanceof TaskOutputRepository) {
      this.outputCache = cache;
    }

    if (config.onProgress) {
      this.onProgress = config.onProgress;
    }

    this.task.emit("start");
    this.task.emit("status", this.task.status);
  }
  private onProgress = (task: ITask, progress: number, message?: string, ...args: any[]) => {};

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
    this.task.emit("status", this.task.status);
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
    this.task.emit("status", this.task.status);
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
    this.task.emit("status", this.task.status);
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

    if (this.task.hasChildren()) {
      this.task.subGraph!.abort();
    }

    this.task.completedAt = new Date();
    this.task.progress = 100;
    this.task.status = TaskStatus.FAILED;
    this.task.error =
      err instanceof TaskError ? err : new TaskFailedError(err?.message || "Task failed");
    this.abortController = undefined;
    this.nodeProvenance = {};
    this.task.emit("error", this.task.error);
    this.task.emit("status", this.task.status);
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
    this.onProgress(this.task, progress, ...args);
    this.task.emit("progress", progress, ...args);
  }
}
