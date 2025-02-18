//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Task } from "../task/Task";
import { TaskGraph } from "./TaskGraph";

/**
 * Interface for task graph schedulers
 */
export interface ITaskGraphScheduler {
  /**
   * Gets an async iterator of tasks that can be executed
   * @returns AsyncIterator of tasks that resolves to each task when it's ready
   */
  tasks(): AsyncIterableIterator<Task>;

  /**
   * Notifies the scheduler that a task has completed
   * @param taskId The ID of the completed task
   */
  onTaskCompleted(taskId: unknown): void;

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
  private sortedNodes: Task[];
  private currentIndex: number;

  constructor(private dag: TaskGraph) {
    this.sortedNodes = [];
    this.currentIndex = 0;
    this.reset();
  }

  async *tasks(): AsyncIterableIterator<Task> {
    while (this.currentIndex < this.sortedNodes.length) {
      yield this.sortedNodes[this.currentIndex++];
    }
  }

  onTaskCompleted(taskId: unknown): void {
    // Topological scheduler doesn't need to track individual task completion
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
  private pendingTasks: Set<Task>;
  private nextResolver: ((task: Task | null) => void) | null = null;

  constructor(private dag: TaskGraph) {
    this.completedTasks = new Set();
    this.pendingTasks = new Set();
    this.reset();
  }

  private isTaskReady(task: Task): boolean {
    const dependencies = this.dag.inEdges(task.config.id).map(([from]) => from);
    return dependencies.every((dep) => this.completedTasks.has(dep));
  }

  private async waitForNextTask(): Promise<Task | null> {
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

  async *tasks(): AsyncIterableIterator<Task> {
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

  reset(): void {
    this.completedTasks.clear();
    this.pendingTasks = new Set(this.dag.topologicallySortedNodes());
    this.nextResolver = null;
  }
}
