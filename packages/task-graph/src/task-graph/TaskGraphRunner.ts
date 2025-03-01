//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskInput, Task, TaskOutput, TaskStatus, Provenance } from "../task/TaskTypes";
import { TaskGraph } from "./TaskGraph";
import { DependencyBasedScheduler, TopologicalScheduler } from "./TaskGraphScheduler";
import { nanoid } from "nanoid";
import { CompoundTask, RegenerativeCompoundTask } from "../task/CompoundTask";
import {
  TaskAbortedError,
  TaskConfigurationError,
  TaskError,
  TaskErrorGroup,
} from "../task/TaskError";
import { DATAFLOW_ALL_PORTS } from "./Dataflow";

export type GraphSingleResult = { id: unknown; type: String; data: TaskOutput };
export type GraphResult = Array<GraphSingleResult>;

/**
 * Class for running a task graph
 * Manages the execution of tasks in a task graph, including provenance tracking and caching
 */
export class TaskGraphRunner {
  /**
   * Map of provenance input for each task
   * @type {Map<unknown, TaskInput>}
   */
  public provenanceInput: Map<unknown, TaskInput>;

  private running = false;
  private reactiveRunning = false;

  /**
   * Constructor for TaskGraphRunner
   * @param graph The task graph to run
   * @param repository The task output repository to use for caching task outputs
   * @param processScheduler The scheduler to use for task execution
   * @param reactiveScheduler The scheduler to use for reactive task execution
   */
  constructor(
    public graph: TaskGraph,
    public repository?: TaskOutputRepository,
    public processScheduler = new DependencyBasedScheduler(graph),
    public reactiveScheduler = new TopologicalScheduler(graph)
  ) {
    this.provenanceInput = new Map();
  }

  private copyInputFromEdgesToNode(node: Task) {
    this.graph.getSourceDataflows(node.config.id).forEach((dataflow) => {
      node.addInputData(dataflow.getPortData());
    });
  }

  /**
   * Retrieves the provenance input for a task
   * @param node The task to retrieve provenance input for
   * @returns The provenance input for the task
   */
  private getInputProvenance(node: Task): TaskInput {
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
  private pushOutputFromNodeToEdges(node: Task, results: TaskOutput, nodeProvenance?: Provenance) {
    this.graph.getTargetDataflows(node.config.id).forEach((dataflow) => {
      dataflow.setPortData(results, nodeProvenance);
    });
  }

  /**
   * Pushes the status of a task to its target edges
   * @param node The task that produced the status
   */
  private pushStatusFromNodeToEdges(graph: TaskGraph, node: Task) {
    if (!node?.config?.id) return;
    graph.getTargetDataflows(node.config.id).forEach((dataflow) => {
      dataflow.status = node.status;
    });
  }

  /**
   * Pushes the error of a task to its target edges
   * @param node The task that produced the error
   */
  private pushErrorFromNodeToEdges(graph: TaskGraph, node: Task) {
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
  private async runTaskWithProvenance(
    task: Task,
    parentProvenance: Provenance
  ): Promise<GraphSingleResult> {
    // Update provenance for the current task
    const nodeProvenance = {
      ...parentProvenance,
      ...this.getInputProvenance(task),
      ...task.getProvenance(),
    };
    this.provenanceInput.set(task.config.id, nodeProvenance);
    this.copyInputFromEdgesToNode(task);

    const shouldUseRepository = !(task.constructor as any).sideeffects && !task.isCompound;

    let results;
    if (shouldUseRepository) {
      results = await this.repository?.getOutput((task.constructor as any).type, task.runInputData);
      if (results) {
        task.handleStart();
        task.runOutputData = results;
        await task.runReactive();
        task.handleComplete();
      }
    }
    if (!results) {
      results = await task.run(nodeProvenance, this.repository);
      if (shouldUseRepository) {
        await this.repository?.saveOutput(
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
      data: results,
    };
  }

  private abortController: AbortController | undefined;

  public handleStart(parentSignal?: AbortSignal) {
    // no reentrancy
    if (this.running || this.reactiveRunning) {
      throw new TaskConfigurationError("Graph is already running");
    }
    this.running = true;
    this.abortController = new AbortController();
    this.abortController.signal.addEventListener("abort", () => {
      this.handleAbort();
    });
    if (parentSignal?.aborted) {
      this.abortController.abort(); // Immediately abort if the parent is already aborted
      return;
    } else {
      parentSignal?.addEventListener(
        "abort",
        () => {
          console.log("runner parent signal sent abort, forwarding to local abort controller");
          this.abortController?.abort();
        },
        { once: true }
      );
    }

    this.running = true;
    this.resetGraph(this.graph, nanoid());
    this.processScheduler.reset();
    this.inProgressTasks.clear();
    this.inProgressFunctions.clear();
    this.failedTaskErrors.clear();
  }

  public handleComplete() {
    this.running = false;
  }

  private inProgressTasks: Map<unknown, Promise<TaskOutput>> = new Map();
  private inProgressFunctions: Map<unknown, Promise<any>> = new Map();
  private failedTaskErrors: Map<unknown, TaskError> = new Map();

  /**
   * Runs the task graph
   * @param parentProvenance The provenance input for the task graph
   * @returns A promise that resolves when all tasks are complete
   * @throws TaskErrorGroup if any tasks have failed
   */
  public async runGraph(
    parentProvenance: Provenance = {},
    parentSignal?: AbortSignal
  ): Promise<GraphResult> {
    this.handleStart(parentSignal);

    const results: GraphResult = [];
    let error: TaskError | undefined;

    try {
      // TODO: A different graph runner may chunck tasks that are in parallel
      // rather them all at once
      for await (const task of this.processScheduler.tasks()) {
        if (this.abortController?.signal.aborted) {
          break;
        }

        // Check if any tasks have failed
        if (this.failedTaskErrors.size > 0) {
          throw new TaskErrorGroup(
            Array.from(this.failedTaskErrors.entries()).map(([key, error]) => ({
              key,
              type: (error as any).name || (error as any).constructor.name,
              error,
            }))
          );
        }

        const runAsync = async () => {
          try {
            const taskPromise = this.runTaskWithProvenance(task, parentProvenance);
            this.inProgressTasks!.set(task.config.id, taskPromise);
            const taskResult = await taskPromise;

            if (this.graph.getTargetDataflows(task.config.id).length === 0) {
              // we save the results of all the leaves
              results.push(taskResult);
            } else {
              //  console.log("task intermediate result", taskResult);
            }
          } catch (error) {
            this.failedTaskErrors.set(task.config.id, error as TaskError);
            throw error;
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
      // this.abort();
      error = err as Error;
    } finally {
    }
    // Wait for all tasks to complete since we did not await runAsync()/this.runTaskWithProvenance()
    await Promise.allSettled(Array.from(this.inProgressTasks.values()));
    // get the straglers. skipping this will show unhandled promise rejections in tests
    await Promise.allSettled(Array.from(this.inProgressFunctions.values())); //cleanup

    if (this.failedTaskErrors.size > 0) {
      const errors = Array.from(this.failedTaskErrors.entries()).map(([key, error]) => ({
        key,
        type: (error as any).name || (error as any).constructor.name,
        error,
      }));
      const errorGroup = new TaskErrorGroup(errors);
      this.handleError();
      throw errorGroup;
    }
    if (this.abortController?.signal.aborted) {
      throw new TaskErrorGroup([
        { key: "*", type: "TaskAbortedError", error: new TaskAbortedError() },
      ]);
    }

    this.handleComplete();

    return results;
  }

  private handleError() {
    const abortPromise = Promise.allSettled(
      this.graph.getNodes().map(async (task: Task) => {
        if ([TaskStatus.PROCESSING].includes(task.status)) {
          task.abort();
        }
      })
    );
    this.inProgressFunctions.set(Symbol("handleError"), abortPromise);
    return abortPromise;
  }

  private resetTask(graph: TaskGraph, task: Task, runId: string) {
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
  }

  /**
   * Resets the task graph, recursively
   * @param graph The task graph to reset
   */
  private resetGraph(graph: TaskGraph, runnerId: string) {
    graph.getNodes().forEach((node) => {
      this.resetTask(graph, node, runnerId);
      if (node.isCompound && node instanceof CompoundTask) {
        if (node instanceof RegenerativeCompoundTask) {
          node.regenerateGraph();
        }
        if (node.subGraph) {
          this.resetGraph(node.subGraph, runnerId);
        }
      }
    });
  }

  /**
   * Aborts the task graph
   */
  public abort() {
    this.abortController?.abort(); // this abort basically just calls handleAbort()
  }

  /**
   * Handles the abort of the task graph via the abort controller
   * The abort controller could be called via the abort() method above,
   * or the via the abort controller by a parent graph runner, etc.
   *
   * @returns A promise that resolves when the abort is complete
   */
  public handleAbort() {
    const abortPromise = Promise.allSettled(
      this.graph.getNodes().map(async (task: Task) => {
        if ([TaskStatus.PROCESSING].includes(task.status)) {
          task.abort();
        }
      })
    );
    this.inProgressTasks.set(Symbol("handleAbort"), abortPromise);
    return abortPromise;
  }

  /**
   * Runs the task graph in a reactive manner
   * @returns A promise that resolves when all tasks are complete
   * @throws TaskConfigurationError if the graph is already running reactively
   */
  public async runGraphReactive(): Promise<GraphResult> {
    if (this.reactiveRunning) {
      throw new TaskConfigurationError("Graph is already running reactively");
    }
    this.reactiveRunning = true;

    if (!this.running) {
      this.resetGraph(this.graph, nanoid());
    }

    this.reactiveScheduler.reset();

    const results: GraphResult = [];

    try {
      for await (const task of this.reactiveScheduler.tasks()) {
        if (task.status === TaskStatus.PENDING) {
          task.resetInputData();
          this.copyInputFromEdgesToNode(task);
          const taskResult = await task.runReactive();
          this.pushOutputFromNodeToEdges(task, taskResult);
          if (this.graph.getTargetDataflows(task.config.id).length === 0) {
            results.push({
              id: task.config.id,
              type: (task.constructor as any).runtype || (task.constructor as any).type,
              data: taskResult,
            });
          }
        }
      }
    } catch (error) {
      throw error;
    } finally {
      this.reactiveRunning = false;
    }
    return results;
  }
}
