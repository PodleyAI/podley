//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  AbortSignalJobError,
  Job,
  JobStatus,
  PermanentJobError,
  IJobExecuteConfig,
} from "@podley/job-queue";
import { TaskInput, TaskOutput } from "@podley/task-graph";
import { getAiProviderRegistry } from "../provider/AiProviderRegistry";
import { getGlobalModelRepository } from "../model/ModelRegistry";

/**
 * Input data for the AiJob
 */
export interface AiProviderInput<Input extends TaskInput = TaskInput> {
  taskType: string;
  aiProvider: string;
  taskInput: Input & { model: string };
}

/**
 * Extends the base Job class to provide custom execution functionality
 * through a provided function.
 */
export class AiJob<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
> extends Job<AiProviderInput<Input>, Output> {
  /**
   * Executes the job using the provided function.
   */
  async execute(input: AiProviderInput<Input>, config: IJobExecuteConfig): Promise<Output> {
    if (config.signal.aborted || this.status === JobStatus.ABORTING) {
      throw new AbortSignalJobError("Abort signal aborted before execution of job");
    }

    let abortHandler: (() => void) | undefined;

    try {
      const abortPromise = new Promise<never>((_resolve, reject) => {
        const handler = () => {
          reject(new AbortSignalJobError("Abort signal seen, ending job"));
        };

        config.signal.addEventListener("abort", handler, { once: true });
        abortHandler = () => config.signal.removeEventListener("abort", handler);
      });

      const runFn = async () => {
        const fn = getAiProviderRegistry().getDirectRunFn<Input, Output>(
          input.aiProvider,
          input.taskType
        );
        if (!fn) {
          throw new PermanentJobError(
            `No run function found for task type ${input.taskType} and model provider ${input.aiProvider}`
          );
        }
        const modelName = input.taskInput.model;
        const model = await getGlobalModelRepository().findByName(modelName);
        if (modelName && !model) {
          throw new PermanentJobError(`Model ${modelName} not found`);
        }
        if (config.signal?.aborted) {
          throw new AbortSignalJobError("Job aborted");
        }
        return await fn(input.taskInput, model, config.updateProgress, config.signal);
      };
      const runFnPromise = runFn();

      return await Promise.race([runFnPromise, abortPromise]);
    } finally {
      // Clean up the abort event listener to prevent memory leaks
      if (abortHandler) {
        abortHandler();
      }
    }
  }
}
