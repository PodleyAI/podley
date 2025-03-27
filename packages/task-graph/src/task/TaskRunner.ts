//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { globalServiceRegistry } from "@ellmers/util";
import { TASK_OUTPUT_REPOSITORY, TaskOutputRepository } from "../storage/TaskOutputRepository";
import { CompoundMergeStrategy, NamedGraphResult } from "../task-graph/TaskGraphRunner";
import { IRunConfig, ITask } from "./ITask";
import { ITaskRunner } from "./ITaskRunner";
import { TaskAbortedError, TaskError, TaskFailedError, TaskInvalidInputError } from "./TaskError";
import { Provenance, TaskConfig, TaskInput, TaskOutput, TaskStatus } from "./TaskTypes";

/**
 * Responsible for running tasks
 * Manages the execution lifecycle of individual tasks
 */
export class TaskRunner<
  ExecuteInput extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
  RunInput extends TaskInput = ExecuteInput,
  RunOutput extends TaskOutput = ExecuteOutput,
> implements ITaskRunner<ExecuteInput, ExecuteOutput, Config, RunInput, RunOutput>
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
  public readonly task: ITask<ExecuteInput, ExecuteOutput, Config, RunInput, RunOutput>;

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
  constructor(
    task: ITask<ExecuteInput, ExecuteOutput, Config, RunInput, RunOutput>,
    outputCache?: TaskOutputRepository
  ) {
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
  async run(overrides: Partial<RunInput> = {}, config: IRunConfig = {}): Promise<RunOutput> {
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

      if (this.task.hasChildren()) {
        // For compound tasks, run the subgraph
        this.task.runExecuteOutputData = await this.executeTaskChildren();
      } else {
        // For simple tasks, we call the task's execute method
        const result = await this.executeTask(this.task.runInputData as unknown as ExecuteInput);
        this.task.runExecuteOutputData = [
          {
            id: this.task.config.id,
            type: this.task.type,
            data: result ?? ({} as unknown as ExecuteOutput),
          },
        ];
        // and then we run the reactive task
        const resultReactive = await this.executeTaskReactive(
          this.task.runInputData as unknown as ExecuteInput,
          this.task.runExecuteOutputData[0].data
        );
        this.task.runExecuteOutputData = [
          {
            id: this.task.config.id,
            type: this.task.type,
            data: resultReactive ?? result ?? ({} as unknown as ExecuteOutput),
          },
        ];
      }
      this.task.runOutputData = this.task.mergeExecuteOutputsToRunOutput(
        this.task.runExecuteOutputData,
        this.task.compoundMerge
      );

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
  public async runReactive(overrides: Partial<RunInput> = {}): Promise<RunOutput> {
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

      if (this.task.runExecuteOutputData.length === 0) {
        // running reactive before a real task run
        this.task.runExecuteOutputData = [
          { id: this.task.config.id, type: this.task.type, data: {} as ExecuteOutput },
        ];
      }

      let reactiveResults: NamedGraphResult<ExecuteOutput> | undefined;
      if (this.task.hasChildren()) {
        reactiveResults = await this.executeTaskChildrenReactive();
      } else {
        const singleResult = await this.executeTaskReactive(
          this.task.runInputData as unknown as ExecuteInput,
          this.task.runExecuteOutputData[0].data
        );
        reactiveResults = [
          {
            id: this.task.config.id,
            type: this.task.type,
            data: singleResult ?? ({} as ExecuteOutput),
          },
        ];
      }

      // for each reactiveResults update the runExecuteOutputData with the same id
      for (const result of reactiveResults) {
        // if (Object.keys(result.data).length === 0) continue;
        const index = this.task.runExecuteOutputData.findIndex((item) => item.id === result.id);
        if (index !== -1) {
          this.task.runExecuteOutputData[index].data = result.data;
        } else {
          this.task.runExecuteOutputData.push({
            id: result.id,
            type: result.type,
            data: result.data,
          });
        }
      }

      this.task.runOutputData = this.task.mergeExecuteOutputsToRunOutput(
        this.task.runExecuteOutputData,
        this.task.compoundMerge
      );

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
  protected async executeTask(input: ExecuteInput): Promise<ExecuteOutput | undefined> {
    return this.task.execute(input, {
      signal: this.abortController!.signal,
      updateProgress: this.handleProgress.bind(this),
      nodeProvenance: this.nodeProvenance,
    });
  }

  /**
   * Protected method to execute a task subgraphby delegating back to the task itself.
   */
  protected async executeTaskChildren(): Promise<NamedGraphResult<ExecuteOutput>> {
    return this.task.subGraph!.run<ExecuteOutput>({
      parentProvenance: this.nodeProvenance || {},
      parentSignal: this.abortController?.signal,
      outputCache: this.outputCache,
    });
  }

  /**
   * Protected method for reactive execution delegation
   */
  protected async executeTaskReactive(
    input: ExecuteInput,
    output: ExecuteOutput
  ): Promise<ExecuteOutput | undefined> {
    return this.task.executeReactive(input, output);
  }

  /**
   * Protected method for reactive execution delegation
   */
  protected async executeTaskChildrenReactive(): Promise<NamedGraphResult<ExecuteOutput>> {
    return this.task.subGraph!.runReactive<ExecuteInput, ExecuteOutput>();
  }

  public mergeExecuteOutputsToRunOutput(
    results: NamedGraphResult<ExecuteOutput>,
    compoundMerge: CompoundMergeStrategy
  ): RunOutput {
    if (this.task.hasChildren()) {
      return this.task.subGraph!.mergeExecuteOutputsToRunOutput(results, compoundMerge);
    } else {
      return results[0].data as unknown as RunOutput;
    }
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
