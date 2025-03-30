//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  collectPropertyValues,
  ConvertAllToOptionalArray,
  globalServiceRegistry,
  uuid4,
} from "@ellmers/util";
import { deepEqual } from "@ellmers/util";
import { TASK_OUTPUT_REPOSITORY, TaskOutputRepository } from "../storage/TaskOutputRepository";
import { TaskInput, TaskOutput, TaskStatus, Provenance } from "../task/TaskTypes";
import { TaskGraph, TaskGraphRunConfig } from "./TaskGraph";
import { DependencyBasedScheduler, TopologicalScheduler } from "./TaskGraphScheduler";
import {
  TaskAbortedError,
  TaskConfigurationError,
  TaskError,
  TaskErrorGroup,
} from "../task/TaskError";
import { ITask } from "../task/ITask";
import { DATAFLOW_ALL_PORTS } from "./Dataflow";

export type GraphSingleResult<T> = {
  id: unknown;
  type: String;
  data: T;
};
export type NamedGraphResult<T> = Array<GraphSingleResult<T>>;
export type UnorderedArrayGraphResult<T> = { data: T[] };
export type PropertyArrayGraphResult<T> = ConvertAllToOptionalArray<T>;
export type LastOrUnorderedArrayGraphResult<T> = T | UnorderedArrayGraphResult<T>;
export type LastOrPropertyArrayGraphResult<T> = T | PropertyArrayGraphResult<T>;
export type LastOrNamedGraphResult<T> = T | NamedGraphResult<T>;
export type AnyGraphResult<T> =
  | T
  | UnorderedArrayGraphResult<T>
  | PropertyArrayGraphResult<T>
  | NamedGraphResult<T>;

export type GraphResultMap<T> = {
  // last -- output is last item in graph
  last: T;
  // named -- output is an array of {id, type, data}
  named: NamedGraphResult<T>;
  // last-or-named -- last if one, otherwise named
  "last-or-named": LastOrNamedGraphResult<T>;
  // last-or-property-array -- last if one, otherwise property-array
  "last-or-property-array": LastOrPropertyArrayGraphResult<T>;
  // last-or-unordered-array -- last if one, otherwise unordered-array
  "last-or-unordered-array": LastOrUnorderedArrayGraphResult<T>;
  // property-array -- output is consolidation of each output property into an array
  "property-array": PropertyArrayGraphResult<T>;
  // unordered-array -- output is simple array of results
  "unordered-array": UnorderedArrayGraphResult<T>;
};

/**
 * Enum representing the possible compound merge strategies
 */
export type CompoundMergeStrategy = keyof GraphResultMap<any>;

/**
 * Class for running a task graph
 * Manages the execution of tasks in a task graph, including provenance tracking and caching
 */
export class TaskGraphRunner {
  /**
   * Whether the task graph is currently running
   */
  protected running = false;
  protected reactiveRunning = false;

  /**
   * Map of provenance input for each task
   */
  protected provenanceInput: Map<unknown, TaskInput>;

  /**
   * The task graph to run
   */
  public readonly graph: TaskGraph;

  /**
   * Output cache repository
   */
  protected outputCache?: TaskOutputRepository;
  /**
   * AbortController for cancelling graph execution
   */
  protected abortController: AbortController | undefined;

  /**
   * Maps to track task execution state
   */
  protected inProgressTasks: Map<unknown, Promise<TaskOutput>> = new Map();
  protected inProgressFunctions: Map<unknown, Promise<any>> = new Map();
  protected failedTaskErrors: Map<unknown, TaskError> = new Map();

  /**
   * Constructor for TaskGraphRunner
   * @param graph The task graph to run
   * @param outputCache The task output repository to use for caching task outputs
   * @param processScheduler The scheduler to use for task execution
   * @param reactiveScheduler The scheduler to use for reactive task execution
   */
  constructor(
    graph: TaskGraph,
    outputCache?: TaskOutputRepository,
    protected processScheduler = new DependencyBasedScheduler(graph),
    protected reactiveScheduler = new TopologicalScheduler(graph)
  ) {
    this.graph = graph;
    this.provenanceInput = new Map();
    graph.outputCache = outputCache;
  }

  // ========================================================================
  // Public methods
  // ========================================================================

  public async runGraph<ExecuteOutput extends TaskOutput>(
    config?: TaskGraphRunConfig
  ): Promise<NamedGraphResult<ExecuteOutput>> {
    await this.handleStart(config);

    const results: NamedGraphResult<ExecuteOutput> = [];
    let error: TaskError | undefined;

    try {
      // TODO: A different graph runner may chunk tasks that are in parallel
      // rather them all currently available
      for await (const task of this.processScheduler.tasks()) {
        if (this.abortController?.signal.aborted) {
          break;
        }

        if (this.failedTaskErrors.size > 0) {
          break;
        }

        const runAsync = async () => {
          try {
            const taskPromise = this.runTaskWithProvenance(task, config?.parentProvenance || {});
            this.inProgressTasks!.set(task.config.id, taskPromise);
            const taskResult = await taskPromise;

            if (this.graph.getTargetDataflows(task.config.id).length === 0) {
              // we save the results of all the leaves
              results.push(taskResult as GraphSingleResult<ExecuteOutput>);
            }
          } catch (error) {
            this.failedTaskErrors.set(task.config.id, error as TaskError);
          } finally {
            this.processScheduler.onTaskCompleted(task.config.id);
            this.pushStatusFromNodeToEdges(this.graph, task);
            this.pushErrorFromNodeToEdges(this.graph, task);
          }
        };

        // Start task execution without awaiting
        // so we can have many tasks running in parallel
        // but keep track of them to make sure they get awaited
        // otherwise, things will finish after this promise is resolved
        this.inProgressFunctions.set(Symbol(task.config.id as string), runAsync());
      }
    } catch (err) {
      error = err as Error;
    }
    // Wait for all tasks to complete since we did not await runAsync()/this.runTaskWithProvenance()
    await Promise.allSettled(Array.from(this.inProgressTasks.values()));
    // Clean up stragglers to avoid unhandled promise rejections
    await Promise.allSettled(Array.from(this.inProgressFunctions.values()));

    if (this.failedTaskErrors.size > 0) {
      const errors = Array.from(this.failedTaskErrors.entries()).map(([key, error]) => ({
        key,
        type: (error as any).name || (error as any).constructor.name,
        error,
      }));
      const errorGroup = new TaskErrorGroup(errors);
      await this.handleError();
      throw errorGroup;
    }
    if (this.abortController?.signal.aborted) {
      throw new TaskErrorGroup([
        { key: "*", type: "TaskAbortedError", error: new TaskAbortedError() },
      ]);
    }

    await this.handleComplete();

    return results;
  }

  /**
   * Runs the task graph in a reactive manner
   * @returns A promise that resolves when all tasks are complete
   * @throws TaskConfigurationError if the graph is already running reactively
   */
  public async runGraphReactive<RunOutput extends TaskOutput>(): Promise<
    NamedGraphResult<RunOutput>
  > {
    await this.handleStartReactive();

    const results: NamedGraphResult<RunOutput> = [];
    console.log("runGraphReactive start");
    try {
      for await (const task of this.reactiveScheduler.tasks()) {
        if (task.status === TaskStatus.PENDING) {
          task.resetInputData();
          this.copyInputFromEdgesToNode(task);
        }
        const taskResult = await task.runReactive();

        this.pushOutputFromNodeToEdges(task, taskResult);
        if (this.graph.getTargetDataflows(task.config.id).length === 0) {
          results.push({
            id: task.config.id,
            type: (task.constructor as any).runtype || (task.constructor as any).type,
            data: taskResult as RunOutput,
          });
        }
      }
      await this.handleCompleteReactive();
      return results;
    } catch (error) {
      await this.handleErrorReactive();
      throw error;
    }
  }

  /**
   * Aborts the task graph execution
   */
  public abort(): void {
    this.abortController?.abort();
  }

  /**
   * Skips the task graph execution
   */
  public async skip(): Promise<void> {
    await this.handleSkip();
  }

  /**
   * Adds input data to a task
   * @param task The task to add input data to
   * @param overrides The input data to override (or add to if an array)
   * @returns true if the input data was changed, false otherwise
   */
  public addInputData(task: ITask, overrides: Partial<TaskInput> | undefined) {
    if (!overrides) return false;

    let changed = false;
    const inputSchema = task.inputSchema;
    const properties = inputSchema.properties || {};

    for (const [inputId, prop] of Object.entries(properties)) {
      if (overrides[inputId] === undefined) continue;

      if (inputId === DATAFLOW_ALL_PORTS) {
        task.runInputData = { ...task.runInputData, ...overrides };
        changed = true;
      } else {
        const isArray =
          prop.type === "array" ||
          (prop.type === "any" &&
            (Array.isArray(overrides[inputId]) || Array.isArray(task.runInputData[inputId])));

        if (isArray) {
          const existingItems = Array.isArray(task.runInputData[inputId])
            ? task.runInputData[inputId]
            : [task.runInputData[inputId]];
          const newitems = [...existingItems];

          const overrideItem = overrides[inputId];
          if (Array.isArray(overrideItem)) {
            newitems.push(...overrideItem);
          } else {
            newitems.push(overrideItem);
          }
          task.runInputData[inputId] = newitems;
          changed = true;
        } else {
          if (!deepEqual(task.runInputData[inputId], overrides[inputId])) {
            task.runInputData[inputId] = overrides[inputId];
            changed = true;
          }
        }
      }
    }

    // TODO(str): This is a hack.
    if (changed && "regenerateGraph" in task && typeof task.regenerateGraph === "function") {
      task.regenerateGraph();
    }
  }

  // ========================================================================
  // Protected Handlers
  // ========================================================================

  public mergeExecuteOutputsToRunOutput<
    ExecuteOutput extends TaskOutput,
    RunOutput extends TaskOutput = ExecuteOutput,
  >(results: NamedGraphResult<ExecuteOutput>, compoundMerge: CompoundMergeStrategy): RunOutput {
    if (compoundMerge === "last") {
      return results[results.length - 1].data as unknown as RunOutput;
    } else if (compoundMerge === "named") {
      return results as unknown as RunOutput;
    } else if (compoundMerge === "unordered-array") {
      return { data: results.map((result) => result.data) } as unknown as RunOutput;
    } else if (compoundMerge === "property-array") {
      return { data: results.map((result) => result.data) } as unknown as RunOutput;
    } else if (compoundMerge === "last-or-named") {
      return results as unknown as RunOutput;
    } else if (compoundMerge === "last-or-unordered-array") {
      return { data: results.map((result) => result.data) } as unknown as RunOutput;
    } else if (compoundMerge === "last-or-property-array") {
      let fixedOutput = {} as RunOutput;
      const outputs = results.map((result: any) => result.data);
      if (outputs.length === 1) {
        fixedOutput = outputs[0] as unknown as RunOutput;
      } else if (outputs.length > 1) {
        const collected = collectPropertyValues<ExecuteOutput>(outputs as ExecuteOutput[]);
        if (Object.keys(collected).length > 0) {
          fixedOutput = collected as unknown as RunOutput;
        }
      }
      return fixedOutput;
    }
    throw new TaskConfigurationError(`Unknown compound merge strategy: ${compoundMerge}`);
  }

  /**
   * Copies input data from edges to a task
   * @param task The task to copy input data to
   */
  protected copyInputFromEdgesToNode(task: ITask) {
    this.graph.getSourceDataflows(task.config.id).forEach((dataflow) => {
      this.addInputData(task, dataflow.getPortData());
    });
  }

  /**
   * Retrieves the provenance input for a task
   * @param node The task to retrieve provenance input for
   * @returns The provenance input for the task
   */
  protected getInputProvenance(node: ITask): TaskInput {
    const nodeProvenance: Provenance = {};
    this.graph.getSourceDataflows(node.config.id).forEach((dataflow) => {
      Object.assign(nodeProvenance, dataflow.provenance);
    });
    return nodeProvenance;
  }

  /**
   * Pushes the output of a task to its target tasks
   * @param node The task that produced the output
   * @param results The output of the task
   * @param nodeProvenance The provenance input for the task
   */
  protected pushOutputFromNodeToEdges(
    node: ITask,
    results: TaskOutput,
    nodeProvenance?: Provenance
  ) {
    this.graph.getTargetDataflows(node.config.id).forEach((dataflow) => {
      dataflow.setPortData(results, nodeProvenance);
    });
  }

  /**
   * Pushes the status of a task to its target edges
   * @param node The task that produced the status
   */
  protected pushStatusFromNodeToEdges(graph: TaskGraph, node: ITask) {
    if (!node?.config?.id) return;
    graph.getTargetDataflows(node.config.id).forEach((dataflow) => {
      dataflow.status = node.status;
      switch (node.status) {
        case TaskStatus.PROCESSING:
          dataflow.events.emit("start");
          break;
        case TaskStatus.COMPLETED:
          dataflow.events.emit("complete");
          break;
        case TaskStatus.ABORTING:
          dataflow.events.emit("abort");
          break;
        case TaskStatus.PENDING:
          dataflow.events.emit("reset");
          break;
        case TaskStatus.FAILED:
          dataflow.events.emit("error", node.error!);
          break;
        case TaskStatus.SKIPPED:
          dataflow.events.emit("skipped");
          break;
      }
    });
  }

  /**
   * Pushes the error of a task to its target edges
   * @param node The task that produced the error
   */
  protected pushErrorFromNodeToEdges(graph: TaskGraph, node: ITask) {
    if (!node?.config?.id) return;
    graph.getTargetDataflows(node.config.id).forEach((dataflow) => {
      dataflow.error = node.error;
    });
  }

  /**
   * Runs a task with provenance input
   * @param task The task to run
   * @param parentProvenance The provenance input for the task
   * @returns The output of the task
   */
  protected async runTaskWithProvenance<T>(
    task: ITask,
    parentProvenance: Provenance
  ): Promise<GraphSingleResult<T>> {
    // Update provenance for the current task
    const nodeProvenance = {
      ...parentProvenance,
      ...this.getInputProvenance(task),
      ...task.getProvenance(),
    };
    this.provenanceInput.set(task.config.id, nodeProvenance);
    this.copyInputFromEdgesToNode(task);

    let results;
    if (task.cacheable) {
      results = await this.outputCache?.getOutput(
        (task.constructor as any).type,
        task.runInputData
      );
      if (results) {
        //@ts-expect-error - using internals
        await task.runner.handleStart();
        task.runOutputData = results;
        await task.runReactive();
        //@ts-expect-error - using internals
        await task.runner.handleComplete();
      }
    }
    if (!results) {
      results = await task.run({}, { nodeProvenance, outputCache: this.outputCache });
      if (task.cacheable) {
        await this.outputCache?.saveOutput(
          (task.constructor as any).type,
          task.runInputData,
          results
        );
      }
    }

    this.pushOutputFromNodeToEdges(task, results, nodeProvenance);

    return {
      id: task.config.id,
      type: (task.constructor as any).runtype || (task.constructor as any).type,
      data: results as T,
    };
  }

  /**
   * Resets a task
   * @param graph The task graph to reset
   * @param task The task to reset
   * @param runId The run ID
   */
  protected resetTask(graph: TaskGraph, task: ITask, runId: string) {
    task.status = TaskStatus.PENDING;
    task.resetInputData();
    task.runOutputData = {};
    task.error = undefined;
    task.progress = 0;
    if (task.config) {
      task.config.runnerId = runId;
    }
    this.pushStatusFromNodeToEdges(graph, task);
    this.pushErrorFromNodeToEdges(graph, task);
    task.emit("reset");
  }

  /**
   * Resets the task graph, recursively
   * @param graph The task graph to reset
   */
  protected resetGraph(graph: TaskGraph, runnerId: string) {
    graph.getTasks().forEach((node) => {
      const changed = deepEqual(node.runInputData, node.defaults);
      this.resetTask(graph, node, runnerId);
      if (changed) {
        if ("regenerateGraph" in node && typeof node.regenerateGraph === "function") {
          node.regenerateGraph();
          // TODO(str): This is a hack.
          // @ts-expect-error - using internals
          this.resetGraph(node.subGraph!, runnerId);
        }
      }
    });
  }

  /**
   * Handles the start of task graph execution
   * @param parentSignal Optional abort signal from parent
   */
  protected async handleStart(config?: TaskGraphRunConfig): Promise<void> {
    if (config?.outputCache !== undefined) {
      if (typeof config.outputCache === "boolean") {
        if (config.outputCache === true) {
          this.outputCache = globalServiceRegistry.get(TASK_OUTPUT_REPOSITORY);
        } else {
          this.outputCache = undefined;
        }
      } else {
        this.outputCache = config.outputCache;
      }
      this.graph.outputCache = this.outputCache;
    }
    // Prevent reentrancy
    if (this.running || this.reactiveRunning) {
      throw new TaskConfigurationError("Graph is already running");
    }

    this.running = true;
    this.abortController = new AbortController();
    this.abortController.signal.addEventListener("abort", () => {
      this.handleAbort();
    });

    if (config?.parentSignal?.aborted) {
      this.abortController.abort(); // Immediately abort if the parent is already aborted
      return;
    } else {
      config?.parentSignal?.addEventListener(
        "abort",
        () => {
          this.abortController?.abort();
        },
        { once: true }
      );
    }

    this.resetGraph(this.graph, uuid4());
    this.processScheduler.reset();
    this.inProgressTasks.clear();
    this.inProgressFunctions.clear();
    this.failedTaskErrors.clear();
  }

  protected async handleStartReactive(): Promise<void> {
    if (this.reactiveRunning) {
      throw new TaskConfigurationError("Graph is already running reactively");
    }
    this.reactiveScheduler.reset();
    this.reactiveRunning = true;
  }

  /**
   * Handles the completion of task graph execution
   */
  protected async handleComplete(): Promise<void> {
    this.running = false;
  }

  protected async handleCompleteReactive(): Promise<void> {
    this.reactiveRunning = false;
  }

  /**
   * Handles errors during task graph execution
   */
  protected async handleError(): Promise<void> {
    await Promise.allSettled(
      this.graph.getTasks().map(async (task: ITask) => {
        if ([TaskStatus.PROCESSING].includes(task.status)) {
          task.abort();
        }
      })
    );
    this.running = false;
  }

  protected async handleErrorReactive(): Promise<void> {
    this.reactiveRunning = false;
  }

  /**
   * Handles task graph abortion
   */
  protected async handleAbort(): Promise<void> {
    this.graph.getTasks().map(async (task: ITask) => {
      if ([TaskStatus.PROCESSING].includes(task.status)) {
        task.abort();
      }
    });

    this.running = false;
  }

  protected async handleAbortReactive(): Promise<void> {
    this.reactiveRunning = false;
  }

  /**
   * Handles task graph skipping
   */
  protected async handleSkip(): Promise<void> {
    await Promise.allSettled(
      this.graph.getTasks().map(async (task: ITask) => {
        if ([TaskStatus.PENDING].includes(task.status)) {
          return task.skip();
        }
      })
    );

    this.running = false;
  }

  /**
   * Handles progress updates for the task graph
   * Currently not implemented at the graph level
   * @param progress Progress value (0-100)
   * @param args Additional arguments
   */
  protected handleProgress(progress: number, ...args: any[]): void {
    // TODO(str): Implement graph level progress tracking
  }
}
