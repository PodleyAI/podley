//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskInput, TaskOutput } from "@ellmers/task-graph";
import { Model } from "../model/Model";
import { globalServiceRegistry, WORKER_MANAGER } from "@ellmers/util";

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
  // Relaxing the generics using `any` allows us to register specialized run functions.
  runFnRegistry: Record<string, Record<string, AiProviderRunFn<any, any>>> = {};

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
    if (!this.runFnRegistry[taskType]) this.runFnRegistry[taskType] = {};
    this.runFnRegistry[taskType][modelProvider] = runFn;
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
    this.registerRunFn(modelProvider, taskType, workerFn);
  }

  /**
   * Retrieves the direct execution function for a task type and model
   * Bypasses the job queue system for immediate execution
   */
  getDirectRunFn<Input extends TaskInput = TaskInput, Output extends TaskOutput = TaskOutput>(
    modelProvider: string,
    taskType: string
  ) {
    const runFn = this.runFnRegistry[taskType]?.[modelProvider] as AiProviderRunFn<Input, Output>;
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
