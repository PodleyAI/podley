//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskOutputRepository } from "../storage/taskoutput/TaskOutputRepository";
import { TaskInput, Task, TaskOutput, TaskStatus } from "../task/Task";
import { TaskGraph } from "./TaskGraph";
import { DependencyBasedScheduler, TopologicalScheduler } from "./TaskGraphScheduler";
import { nanoid } from "nanoid";
import { CompoundTask, RegenerativeCompoundTask } from "../task/CompoundTask";

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
  private aborting = false;

  /**
   * Constructor for TaskGraphRunner
   * @param dag The task graph to run
   * @param repository The task output repository to use for caching task outputs
   * @param processScheduler The scheduler to use for task execution
   * @param reactiveScheduler The scheduler to use for reactive task execution
   */
  constructor(
    public dag: TaskGraph,
    public repository?: TaskOutputRepository,
    public processScheduler = new DependencyBasedScheduler(dag),
    public reactiveScheduler = new TopologicalScheduler(dag)
  ) {
    this.provenanceInput = new Map();
  }

  private copyInputFromEdgesToNode(node: Task) {
    this.dag.getSourceDataFlows(node.config.id).forEach((dataFlow) => {
      const toInput: TaskInput = {};
      toInput[dataFlow.targetTaskInputId] = dataFlow.value;
      node.addInputData(toInput);
    });
  }

  /**
   * Retrieves the provenance input for a task
   * @param node The task to retrieve provenance input for
   * @returns The provenance input for the task
   */
  private getInputProvenance(node: Task): TaskInput {
    const nodeProvenance: TaskInput = {};
    this.dag.getSourceDataFlows(node.config.id).forEach((dataFlow) => {
      Object.assign(nodeProvenance, dataFlow.provenance);
    });
    return nodeProvenance;
  }

  /**
   * Pushes the output of a task to its target tasks
   * @param node The task that produced the output
   * @param results The output of the task
   * @param nodeProvenance The provenance input for the task
   */
  private pushOutputFromNodeToEdges(node: Task, results: TaskOutput, nodeProvenance?: TaskInput) {
    this.dag.getTargetDataFlows(node.config.id).forEach((dataFlow) => {
      if (results[dataFlow.sourceTaskOutputId] !== undefined) {
        dataFlow.value = results[dataFlow.sourceTaskOutputId];
      }
      if (nodeProvenance) dataFlow.provenance = nodeProvenance;
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
    parentProvenance: TaskInput
  ): Promise<TaskOutput> {
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
        task.emit("start");
        task.emit("progress", 100, Object.values(results)[0]);
        task.runOutputData = results;
        await task.runReactive();
        task.emit("complete");
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
    return results;
  }

  /**
   * Runs the task graph
   * @param parentProvenance The provenance input for the task graph
   * @returns A promise that resolves when all tasks are complete
   */
  public async runGraph(parentProvenance: TaskInput = {}) {
    if (this.running) {
      throw new Error("Graph is already running");
    }
    if (this.reactiveRunning) {
      throw new Error("Graph is already running reactively");
    }

    this.running = true;
    this.aborting = false;
    this.resetGraph(this.dag);
    this.processScheduler.reset();

    const inProgressTasks = new Map<unknown, Promise<TaskOutput>>();
    const results: TaskOutput[] = [];

    try {
      for await (const task of this.processScheduler.tasks()) {
        if (this.aborting) break;

        // Start task execution without awaiting
        const taskPromise = this.runTaskWithProvenance(task, parentProvenance);
        inProgressTasks.set(task.config.id, taskPromise);

        // Set up completion handler
        taskPromise.then(
          (taskResult) => {
            this.processScheduler.onTaskCompleted(task.config.id);
            inProgressTasks.delete(task.config.id);
            if (this.dag.getTargetDataFlows(task.config.id).length === 0) {
              results.push(taskResult);
            }
          },
          async (error) => {
            await this.abort();
            throw error;
          }
        );
      }

      // Wait for all tasks to complete
      await Promise.all(Array.from(inProgressTasks.values()));

      if (this.aborting) {
        throw new Error("Graph execution was aborted");
      }
    } catch (error) {
      await this.abort();
      throw error;
    } finally {
      this.running = false;
    }
    return results;
  }

  /**
   * Resets the task graph, recursively
   * @param dag The task graph to reset
   */
  private resetGraph(dag: TaskGraph) {
    const taskRunId = nanoid();
    dag.getNodes().forEach((node) => {
      if (node.config) {
        // @ts-ignore
        node.config.currentJobRunId = taskRunId;
      }
      node.status = TaskStatus.PENDING;
      node.resetInputData();
      node.runOutputData = {};
      if (node.isCompound) {
        const subGraph = (node as CompoundTask).subGraph;
        if (node instanceof RegenerativeCompoundTask) {
          node.regenerateGraph();
        }
        if (subGraph) {
          this.resetGraph(subGraph);
        }
      }
    });
  }

  /**
   * Aborts the task graph
   */
  public async abort() {
    await Promise.all(
      this.dag.getNodes().map(async (task: Task) => {
        console.log("aborting task", task.config.id, task.status, task);
        if ([TaskStatus.PROCESSING, TaskStatus.PENDING].includes(task.status)) {
          if (task.status === TaskStatus.PENDING) {
            task.emit("complete");
          }
          await task.abort();
        }
      })
    );
    this.aborting = true;
  }

  /**
   * Runs the task graph in a reactive manner
   * @returns A promise that resolves when all tasks are complete
   */
  public async runGraphReactive() {
    if (this.reactiveRunning) {
      throw new Error("Graph is already running reactively");
    }
    this.reactiveRunning = true;

    if (!this.running) {
      this.resetGraph(this.dag);
      this.aborting = false;
    }

    this.reactiveScheduler.reset();

    const results: TaskOutput[] = [];

    try {
      for await (const task of this.reactiveScheduler.tasks()) {
        if (this.aborting) break;
        if (task.status === TaskStatus.PENDING) {
          task.resetInputData();
          this.copyInputFromEdgesToNode(task);
          const taskResult = await task.runReactive();
          this.pushOutputFromNodeToEdges(task, taskResult);
          if (this.dag.getTargetDataFlows(task.config.id).length === 0) {
            results.push(taskResult);
          }
        }
      }

      if (this.aborting) {
        throw new Error("Graph execution was aborted");
      }
    } catch (error) {
      await this.abort();
      throw error;
    } finally {
      this.reactiveRunning = false;
    }
    return results;
  }
}
