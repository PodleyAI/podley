//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ITask } from "../task/ITask";
import { TaskGraph } from "./TaskGraph";

/**
 * Interface for task graph schedulers
 */
export interface ITaskGraphScheduler {
  /**
   * Gets an async iterator of tasks that can be executed
   * @returns AsyncIterator of tasks that resolves to each task when it's ready
   */
  tasks(): AsyncIterableIterator<ITask>;

  /**
   * Notifies the scheduler that a task has completed
   * @param taskId The ID of the completed task
   */
  onTaskCompleted(taskId: unknown): void;

  /**
   * Notifies the scheduler that a dataflow became ready for consumption
   * @param taskId The ID of the task that may now be ready
   */
  onDataflowReady(taskId: unknown): void;

  /**
   * Resets the scheduler state
   */
  reset(): void;
}

/**
 * Sequential scheduler that executes one task at a time in topological order
 * Useful for debugging and understanding task execution flow
 */
export class TopologicalScheduler implements ITaskGraphScheduler {
  private sortedNodes: ITask[];
  private currentIndex: number;

  constructor(private dag: TaskGraph) {
    this.sortedNodes = [];
    this.currentIndex = 0;
    this.reset();
  }

  async *tasks(): AsyncIterableIterator<ITask> {
    while (this.currentIndex < this.sortedNodes.length) {
      yield this.sortedNodes[this.currentIndex++];
    }
  }

  onTaskCompleted(taskId: unknown): void {
    // Topological scheduler doesn't need to track individual task completion
  }

  onDataflowReady(_taskId: unknown): void {
    // Topological scheduler does not react to streaming readiness
  }

  reset(): void {
    this.sortedNodes = this.dag.topologicallySortedNodes();
    this.currentIndex = 0;
  }
}

/**
 * Event-driven scheduler that executes tasks as soon as their dependencies are satisfied
 * Most efficient for parallel execution but requires completion notifications
 */
export class DependencyBasedScheduler implements ITaskGraphScheduler {
  private completedTasks: Set<unknown>;
  private pendingTasks: Set<ITask>;
  private nextResolver: ((task: ITask | null) => void) | null = null;

  constructor(private dag: TaskGraph) {
    this.completedTasks = new Set();
    this.pendingTasks = new Set();
    this.reset();
  }

  private isTaskReady(task: ITask): boolean {
    const dataflows = this.dag.getSourceDataflows(task.config.id);
    if (dataflows.length === 0) {
      return true;
    }
    return dataflows.every((dataflow) => {
      const descriptor = dataflow.getStreamDescriptor();
      if (descriptor) {
        if (descriptor.readiness === "first-chunk") {
          if (dataflow.streamReadinessReached()) {
            return true;
          }
          return this.completedTasks.has(dataflow.sourceTaskId);
        }
        if (descriptor.readiness === "final") {
          if (dataflow.streamReadinessReached()) {
            return true;
          }
          return this.completedTasks.has(dataflow.sourceTaskId);
        }
      }
      return this.completedTasks.has(dataflow.sourceTaskId);
    });
  }

  private async waitForNextTask(): Promise<ITask | null> {
    if (this.pendingTasks.size === 0) return null;

    const readyTask = Array.from(this.pendingTasks).find((task) => this.isTaskReady(task));
    if (readyTask) {
      this.pendingTasks.delete(readyTask);
      return readyTask;
    }

    // If there are pending tasks but none are ready, wait for task completion
    if (this.pendingTasks.size > 0) {
      return new Promise((resolve) => {
        this.nextResolver = resolve;
      });
    }

    return null;
  }

  async *tasks(): AsyncIterableIterator<ITask> {
    while (this.pendingTasks.size > 0) {
      const task = await this.waitForNextTask();
      if (task) {
        yield task;
      } else {
        break;
      }
    }
  }

  onTaskCompleted(taskId: unknown): void {
    this.completedTasks.add(taskId);

    // Check if any pending tasks are now ready
    if (this.nextResolver) {
      const readyTask = Array.from(this.pendingTasks).find((task) => this.isTaskReady(task));
      if (readyTask) {
        this.pendingTasks.delete(readyTask);
        const resolver = this.nextResolver;
        this.nextResolver = null;
        resolver(readyTask);
      }
    }
  }

  onDataflowReady(taskId: unknown): void {
    if (!this.nextResolver) return;
    const candidate = Array.from(this.pendingTasks).find(
      (task) => task.config.id === taskId && this.isTaskReady(task)
    );
    if (candidate) {
      this.pendingTasks.delete(candidate);
      const resolver = this.nextResolver;
      this.nextResolver = null;
      resolver(candidate);
      return;
    }
    const readyTask = Array.from(this.pendingTasks).find((task) => this.isTaskReady(task));
    if (readyTask) {
      this.pendingTasks.delete(readyTask);
      const resolver = this.nextResolver;
      this.nextResolver = null;
      resolver(readyTask);
    }
  }

  reset(): void {
    this.completedTasks.clear();
    this.pendingTasks = new Set(this.dag.topologicallySortedNodes());
    this.nextResolver = null;
  }
}
