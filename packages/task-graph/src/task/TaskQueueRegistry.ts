//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { JobQueue } from "@ellmers/job-queue";
import { TaskInput, TaskOutput } from "./TaskTypes";

/**
 * Global singleton instance of the TaskQueueRegistry.
 * This is used to manage all job queues across the application.
 */
let taskQueueRegistry: TaskQueueRegistry<TaskInput, TaskOutput> | null = null;

/**
 * Registry for managing task queues in the application.
 * Provides functionality to register, manage, and control job queues.
 *
 * @template Input - The type of input data for tasks in the queues
 * @template Output - The type of output data for tasks in the queues
 */
export class TaskQueueRegistry<Input, Output> {
  /**
   * Map of queue names to their corresponding JobQueue instances
   */
  public queues: Map<string, JobQueue<Input, Output>> = new Map();

  /**
   * Registers a new job queue with the registry
   *
   * @param jobQueue - The job queue to register
   * @throws Error if a queue with the same name already exists
   */
  registerQueue(jobQueue: JobQueue<any, any>): void {
    if (this.queues.has(jobQueue.queueName)) {
      throw new Error(`Queue with name ${jobQueue.queueName} already exists`);
    }
    this.queues.set(jobQueue.queueName, jobQueue);
  }

  /**
   * Retrieves a job queue by its name
   *
   * @param queue - The name of the queue to retrieve
   * @returns The job queue instance or undefined if not found
   */
  getQueue(queue: string): JobQueue<Input, Output> | undefined {
    return this.queues.get(queue);
  }

  /**
   * Starts all registered job queues
   * This allows queues to begin processing their jobs
   *
   * @returns The registry instance for chaining
   */
  startQueues() {
    for (const queue of this.queues.values()) {
      queue.start();
    }
    return this;
  }

  /**
   * Stops all registered job queues
   * This pauses job processing but maintains the queued jobs
   *
   * @returns The registry instance for chaining
   */
  stopQueues() {
    for (const queue of this.queues.values()) {
      queue.stop();
    }
    return this;
  }

  /**
   * Clears all registered job queues
   * This removes all queued jobs from the queues
   *
   * @returns The registry instance for chaining
   */
  clearQueues() {
    for (const queue of this.queues.values()) {
      queue.clear();
    }
    return this;
  }
}

/**
 * Gets the global TaskQueueRegistry instance
 * Creates a new instance if one doesn't exist
 *
 * @returns The global TaskQueueRegistry instance
 */
export function getTaskQueueRegistry(): TaskQueueRegistry<TaskInput, TaskOutput> {
  if (!taskQueueRegistry) {
    taskQueueRegistry = new TaskQueueRegistry<TaskInput, TaskOutput>();
  }
  return taskQueueRegistry;
}

/**
 * Sets the global TaskQueueRegistry instance
 * Stops and clears any existing registry before replacing it
 *
 * @param registry - The new registry instance to use, or null to clear
 */
export function setTaskQueueRegistry(registry: TaskQueueRegistry<any, any> | null): void {
  if (taskQueueRegistry) {
    taskQueueRegistry.stopQueues();
    taskQueueRegistry.clearQueues();
  }
  taskQueueRegistry = registry;
}
