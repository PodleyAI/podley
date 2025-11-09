//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { globalServiceRegistry } from "@podley/util";
import { TASK_OUTPUT_REPOSITORY, TaskOutputRepository } from "../storage/TaskOutputRepository";
import { ITaskGraph } from "../task-graph/ITaskGraph";
import { IWorkflow } from "../task-graph/IWorkflow";
import { TaskGraph } from "../task-graph/TaskGraph";
import { ensureTask, type Taskish } from "../task-graph/Conversions";
import { IRunConfig, type IExecuteContext, ITask } from "./ITask";
import { ITaskRunner } from "./ITaskRunner";
import { Task } from "./Task";
import {
  TaskAbortedError,
  TaskConfigurationError,
  TaskError,
  TaskFailedError,
  TaskInvalidInputError,
} from "./TaskError";
import {
  Provenance,
  TaskConfig,
  TaskInput,
  TaskOutput,
  TaskStatus,
  type TaskStreamPortDescriptor,
  type TaskStream,
} from "./TaskTypes";
import { GraphAsTask } from "../task/GraphAsTask";
import { Workflow } from "../task-graph/Workflow";
import { isTaskStream, toAsyncIterable } from "./TaskStream";

interface TaskStreamRuntimeState {
  readonly portId: string;
  readonly descriptor: TaskStreamPortDescriptor<any, any>;
  aggregate: unknown;
  started: boolean;
  done: boolean;
  contextManaged: boolean;
  returnedStream: boolean;
  chunkCount: number;
}

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
     * Streaming runtime state keyed by output port id
     */
    protected streamStates: Map<string, TaskStreamRuntimeState> | null = null;

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

      const inputs: Input = this.task.runInputData as Input;
      let outputs: Output | undefined;
        if (this.task.cacheable) {
          outputs = (await this.outputCache?.getOutput(this.task.type, inputs)) as Output;
          if (outputs) {
            this.task.runOutputData = await this.executeTaskReactive(inputs, outputs);
          }
        }
        if (!outputs) {
          outputs = await this.executeTask(inputs, config);
          if (this.task.cacheable && outputs !== undefined) {
            await this.outputCache?.saveOutput(this.task.type, inputs, outputs);
          }
          this.task.runOutputData = outputs ?? ({} as Output);
        }

      await this.handleComplete();

      return this.task.runOutputData as Output;
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
      return this.task.runOutputData as Output;
    }
    this.task.setInput(overrides);

    await this.handleStartReactive();

    try {
      const isValid = await this.task.validateInput(this.task.runInputData);
      if (!isValid) {
        throw new TaskInvalidInputError("Invalid input data");
      }

      const resultReactive = await this.executeTaskReactive(
        this.task.runInputData as Input,
        this.task.runOutputData as Output
      );

      this.task.runOutputData = resultReactive;

      await this.handleCompleteReactive();
      return this.task.runOutputData as Output;
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
   * Handles streaming-aware execution, collecting chunks and final output.
   */
  protected async executeTask(input: Input, config: IRunConfig): Promise<Output> {
    const streamStates = this.prepareStreamStates();
    const streamPromises: Promise<void>[] = [];
    const context = this.createExecuteContext(streamStates, config, streamPromises);

    const rawResult = await this.task.execute(input, context);
    const normalizedResult = this.normalizeExecuteResult(rawResult);

    await this.consumeStreamsFromResult(
      normalizedResult,
      streamStates,
      config,
      streamPromises
    );

    await this.finalizeContextDrivenStreams(streamStates, config);

    await Promise.all(streamPromises);

    this.applyFinalStreamResults(normalizedResult, streamStates);

    this.streamStates = null;

    return await this.executeTaskReactive(input, normalizedResult as Output);
  }

  protected prepareStreamStates(): Map<string, TaskStreamRuntimeState> {
    const descriptor = this.task.streaming();
    const states = new Map<string, TaskStreamRuntimeState>();
    for (const [portId, portDescriptor] of Object.entries(descriptor.outputs)) {
      states.set(portId, {
        portId,
        descriptor: portDescriptor,
        aggregate: portDescriptor.accumulator.initial(),
        started: false,
        done: false,
        contextManaged: false,
        returnedStream: false,
        chunkCount: 0,
      });
    }
    this.streamStates = states;
    return states;
  }

  protected createExecuteContext(
    streamStates: Map<string, TaskStreamRuntimeState>,
    config: IRunConfig,
    streamPromises: Promise<void>[]
  ): IExecuteContext {
    const pushChunk = (portId: string, chunk: unknown) => {
      const state = this.ensureStreamState(portId, streamStates);
      state.contextManaged = true;
      const pending = this.pushStreamChunk(state, chunk, config);
      const tracked = pending.catch(async (error) => {
        await this.handleStreamError(state, error, config);
        throw error;
      });
      streamPromises.push(tracked);
      return tracked;
    };

    const closeStream = (portId: string) => {
      const state = this.ensureStreamState(portId, streamStates);
      const pending = this.closeStreamState(state, config);
      const tracked = pending.catch(async (error) => {
        await this.handleStreamError(state, error, config);
        throw error;
      });
      streamPromises.push(tracked);
      return tracked;
    };

    const attachStreamController = <Chunk>(
      portId: string,
      controller: ReadableStreamDefaultController<Chunk>
    ) => {
      const state = this.ensureStreamState(portId, streamStates);
      const originalEnqueue = controller.enqueue.bind(controller);
      controller.enqueue = ((chunk: Chunk) => {
        originalEnqueue(chunk);
        void pushChunk(portId, chunk);
      }) as typeof controller.enqueue;

      const originalClose = controller.close.bind(controller);
      controller.close = (() => {
        originalClose();
        void closeStream(portId);
      }) as typeof controller.close;

      const originalError = controller.error.bind(controller);
      controller.error = ((reason?: unknown) => {
        originalError(reason);
        const trackedError = this.handleStreamError(
          state,
          reason ?? new Error("Stream error"),
          config
        ).catch((error) => {
          throw error;
        });
        streamPromises.push(trackedError);
      }) as typeof controller.error;

      return controller;
    };

    return {
      signal: this.abortController!.signal,
      updateProgress: this.handleProgress.bind(this),
      nodeProvenance: this.nodeProvenance,
      own: this.own,
      pushChunk,
      closeStream,
      attachStreamController,
    };
  }

  protected normalizeExecuteResult(
    result: Output | undefined
  ): Record<string, unknown> {
    if (result && typeof result === "object") {
      return { ...(result as Record<string, unknown>) };
    }
    return {};
  }

  protected async consumeStreamsFromResult(
    result: Record<string, unknown>,
    streamStates: Map<string, TaskStreamRuntimeState>,
    config: IRunConfig,
    streamPromises: Promise<void>[]
  ): Promise<void> {
    for (const [portId, state] of streamStates.entries()) {
      if (result[portId] === undefined) {
        continue;
      }
      const value = result[portId];
      if (isTaskStream(value)) {
        state.returnedStream = true;
        delete result[portId];
        const promise = this.consumeStream(state, value as TaskStream<unknown>, config);
        streamPromises.push(promise);
      } else {
        state.aggregate = value;
        state.done = true;
        this.task.runOutputData = {
          ...this.task.runOutputData,
          [state.portId]: state.aggregate,
        };
      }
    }
  }

  protected async finalizeContextDrivenStreams(
    streamStates: Map<string, TaskStreamRuntimeState>,
    config: IRunConfig
  ): Promise<void> {
    for (const state of streamStates.values()) {
      if (state.contextManaged && !state.done) {
        await this.closeStreamState(state, config);
      }
    }
  }

  protected applyFinalStreamResults(
    result: Record<string, unknown>,
    streamStates: Map<string, TaskStreamRuntimeState>
  ): void {
    for (const state of streamStates.values()) {
      if (!state.done) {
        continue;
      }
      result[state.portId] = state.aggregate;
    }
  }

  protected ensureStreamState(
    portId: string,
    streamStates: Map<string, TaskStreamRuntimeState>
  ): TaskStreamRuntimeState {
    const state = streamStates.get(portId);
    if (!state) {
      throw new TaskConfigurationError(
        `Task "${this.task.type}" attempted to stream on undeclared output port "${portId}".`
      );
    }
    return state;
  }

  protected async startStream(
    state: TaskStreamRuntimeState,
    config: IRunConfig
  ): Promise<void> {
    if (state.started) return;
    state.started = true;
    if (this.task.status !== TaskStatus.STREAMING) {
      this.task.status = TaskStatus.STREAMING;
      this.task.emit("status", this.task.status);
    }
    this.task.emit("stream_start", state.portId);
    if (config.onStreamStart) {
      await config.onStreamStart(this.task, state.portId, state.descriptor);
    }
  }

  protected async pushStreamChunk(
    state: TaskStreamRuntimeState,
    chunk: unknown,
    config: IRunConfig
  ): Promise<void> {
    if (this.abortController?.signal.aborted) {
      throw new TaskAbortedError();
    }
    await this.startStream(state, config);
    state.aggregate = state.descriptor.accumulator.accumulate(state.aggregate, chunk);
    state.chunkCount += 1;
    this.task.runOutputData = {
      ...this.task.runOutputData,
      [state.portId]: state.aggregate,
    };
    this.task.emit("stream_chunk", state.portId, chunk, state.aggregate);
    if (config.onStreamChunk) {
      await config.onStreamChunk(this.task, state.portId, chunk, state.aggregate);
    }
  }

  protected async closeStreamState(
    state: TaskStreamRuntimeState,
    config: IRunConfig
  ): Promise<void> {
    if (state.done) return;
    state.done = true;
    state.aggregate = state.descriptor.accumulator.complete(state.aggregate);
    this.task.runOutputData = {
      ...this.task.runOutputData,
      [state.portId]: state.aggregate,
    };
    this.task.emit("stream_end", state.portId, state.aggregate);
    if (config.onStreamEnd) {
      await config.onStreamEnd(this.task, state.portId, state.aggregate);
    }
  }

  protected async handleStreamError(
    state: TaskStreamRuntimeState,
    error: unknown,
    config: IRunConfig
  ): Promise<never> {
    state.done = true;
    if (error instanceof TaskAbortedError) {
      throw error;
    }
    const taskError =
      error instanceof TaskError
        ? error
        : new TaskFailedError(
            error instanceof Error ? error.message : String(error ?? "Stream error")
          );
    if (config.onStreamError) {
      await config.onStreamError(this.task, state.portId, taskError);
    }
    throw taskError;
  }

  protected consumeStream(
    state: TaskStreamRuntimeState,
    stream: TaskStream<unknown>,
    config: IRunConfig
  ): Promise<void> {
    return (async () => {
      try {
        for await (const chunk of toAsyncIterable(stream)) {
          await this.pushStreamChunk(state, chunk, config);
        }
        await this.closeStreamState(state, config);
      } catch (error) {
        await this.handleStreamError(state, error, config);
      }
    })();
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
    this.streamStates = null;

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

    if (config.updateProgress) {
      this.updateProgress = config.updateProgress;
    }

    this.task.emit("start");
    this.task.emit("status", this.task.status);
  }
  private updateProgress = async (
    task: ITask,
    progress: number,
    message?: string,
    ...args: any[]
  ) => {};

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
    this.streamStates = null;
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
    this.streamStates = null;

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
    this.streamStates = null;
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
    this.streamStates = null;
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
  protected async handleProgress(
    progress: number,
    message?: string,
    ...args: any[]
  ): Promise<void> {
    this.task.progress = progress;
    await this.updateProgress(this.task, progress, message, ...args);
    this.task.emit("progress", progress, message, ...args);
  }
}
