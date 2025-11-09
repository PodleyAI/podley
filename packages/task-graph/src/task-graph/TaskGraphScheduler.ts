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
  /** Map of task IDs to tasks that are currently streaming */
  private streamingTasks: Map<unknown, ITask> = new Map();
  /** Map of task IDs to whether they have produced at least one streaming chunk */
  private streamingTasksWithChunks: Set<unknown> = new Set();

  constructor(private dag: TaskGraph) {
    this.completedTasks = new Set();
    this.pendingTasks = new Set();
    this.reset();
  }

  private isTaskReady(task: ITask): boolean {
    const dependencies = this.dag
      .getSourceDataflows(task.config.id)
      .map((dataflow) => dataflow.sourceTaskId);
    return dependencies.every((dep) => {
      // Task is ready if dependency is completed OR streaming and has produced chunks
      return (
        this.completedTasks.has(dep) ||
        (this.streamingTasks.has(dep) && this.streamingTasksWithChunks.has(dep))
      );
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

  /**
   * Notifies the scheduler that a task has started streaming
   * @param taskId The ID of the task that started streaming
   * @param task The task instance
   */
  onTaskStreamingStart(taskId: unknown, task: ITask): void {
    this.streamingTasks.set(taskId, task);
    // Check if any pending tasks are now ready
    this.checkForReadyTasks();
  }

  /**
   * Notifies the scheduler that a streaming task has produced a chunk
   * @param taskId The ID of the task that produced the chunk
   */
  onTaskStreamingChunk(taskId: unknown): void {
    this.streamingTasksWithChunks.add(taskId);
    // Check if any pending tasks are now ready
    this.checkForReadyTasks();
  }

  /**
   * Checks for ready tasks and resolves the next resolver if found
   */
  private checkForReadyTasks(): void {
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

  onTaskCompleted(taskId: unknown): void {
    this.completedTasks.add(taskId);
    // Remove from streaming tasks if it was streaming
    this.streamingTasks.delete(taskId);
    this.streamingTasksWithChunks.delete(taskId);

    // Check if any pending tasks are now ready
    this.checkForReadyTasks();
  }

  reset(): void {
    this.completedTasks.clear();
    this.pendingTasks = new Set(this.dag.topologicallySortedNodes());
    this.nextResolver = null;
    this.streamingTasks.clear();
    this.streamingTasksWithChunks.clear();
  }
}
