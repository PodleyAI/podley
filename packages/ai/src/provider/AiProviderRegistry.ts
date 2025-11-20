/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskInput, TaskOutput } from "@podley/task-graph";
import { globalServiceRegistry, WORKER_MANAGER } from "@podley/util";
import { Model } from "../model/Model";

/**
 * Type for the run function for the AiJob
 */
export type AiProviderRunFn<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> = (
  input: Input,
  model: Model | undefined,
  update_progress: (progress: number, message?: string, details?: any) => void,
  signal: AbortSignal
) => Promise<Output>;

/**
 * Registry that manages provider-specific task execution functions and job queues.
 * Handles the registration, retrieval, and execution of task processing functions
 * for different model providers and task types.
 */
export class AiProviderRegistry {
  runFnRegistry: Map<string, Map<string, AiProviderRunFn<any, any>>> = new Map();

  /**
   * Registers a task execution function for a specific task type and model provider
   * @param taskType - The type of task (e.g., 'text-generation', 'embedding')
   * @param modelProvider - The provider of the model (e.g., 'hf-transformers', 'tf-mediapipe', 'openai', etc)
   * @param runFn - The function that executes the task
   */
  registerRunFn<Input extends TaskInput = TaskInput, Output extends TaskOutput = TaskOutput>(
    modelProvider: string,
    taskType: string,
    runFn: AiProviderRunFn<Input, Output>
  ) {
    if (!this.runFnRegistry.has(taskType)) {
      this.runFnRegistry.set(taskType, new Map());
    }
    this.runFnRegistry.get(taskType)!.set(modelProvider, runFn);
  }

  registerAsWorkerRunFn<
    Input extends TaskInput = TaskInput,
    Output extends TaskOutput = TaskOutput,
  >(modelProvider: string, taskType: string) {
    const workerFn: AiProviderRunFn<Input, Output> = async (
      input: Input,
      model: Model | undefined,
      update_progress: (progress: number, message?: string, details?: any) => void,
      signal?: AbortSignal
    ) => {
      const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
      const result = await workerManager.callWorkerFunction<Output>(
        modelProvider,
        taskType,
        [input, model],
        {
          signal: signal,
          onProgress: update_progress,
        }
      );
      return result;
    };
    this.registerRunFn<Input, Output>(modelProvider, taskType, workerFn);
  }

  /**
   * Retrieves the direct execution function for a task type and model
   * Bypasses the job queue system for immediate execution
   */
  getDirectRunFn<Input extends TaskInput = TaskInput, Output extends TaskOutput = TaskOutput>(
    modelProvider: string,
    taskType: string
  ) {
    const taskTypeMap = this.runFnRegistry.get(taskType);
    const runFn = taskTypeMap?.get(modelProvider) as AiProviderRunFn<Input, Output> | undefined;
    if (!runFn) {
      throw new Error(
        `No run function found for task type ${taskType} and model provider ${modelProvider}`
      );
    }
    return runFn;
  }
}

// Singleton instance management for the ProviderRegistry
let providerRegistry: AiProviderRegistry;
export function getAiProviderRegistry() {
  if (!providerRegistry) providerRegistry = new AiProviderRegistry();
  return providerRegistry;
}
export function setAiProviderRegistry(pr: AiProviderRegistry) {
  providerRegistry = pr;
}
