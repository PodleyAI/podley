/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AbortSignalJobError,
  IJobExecuteContext,
  Job,
  JobStatus,
  PermanentJobError,
} from "@workglow/job-queue";
import { TaskInput, TaskOutput } from "@workglow/task-graph";
import type { ModelRecord } from "../model/ModelSchema";
import { getAiProviderRegistry } from "../provider/AiProviderRegistry";

function isModelRecord(value: unknown): value is ModelRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "model_id" in value &&
    "provider" in value &&
    "tasks" in value
  );
}

/**
 * Input data for the AiJob
 */
export interface AiJobInput<Input extends TaskInput = TaskInput> {
  taskType: string;
  aiProvider: string;
  taskInput: Input & { model: ModelRecord };
}

/**
 * Extends the base Job class to provide custom execution functionality
 * through a provided function.
 */
export class AiJob<
  Input extends AiJobInput<TaskInput> = AiJobInput<TaskInput>,
  Output extends TaskOutput = TaskOutput,
> extends Job<Input, Output> {
  /**
   * Executes the job using the provided function.
   */
  async execute(input: Input, context: IJobExecuteContext): Promise<Output> {
    if (context.signal.aborted || this.status === JobStatus.ABORTING) {
      throw new AbortSignalJobError("Abort signal aborted before execution of job");
    }

    let abortHandler: (() => void) | undefined;

    try {
      const abortPromise = new Promise<never>((_resolve, reject) => {
        const handler = () => {
          reject(new AbortSignalJobError("Abort signal seen, ending job"));
        };

        context.signal.addEventListener("abort", handler, { once: true });
        abortHandler = () => context.signal.removeEventListener("abort", handler);
      });

      const runFn = async () => {
        const fn = getAiProviderRegistry().getDirectRunFn<Input["taskInput"], Output>(
          input.aiProvider,
          input.taskType
        );
        if (!fn) {
          throw new PermanentJobError(
            `No run function found for task type ${input.taskType} and model provider ${input.aiProvider}`
          );
        }
        const model = input.taskInput.model;
        if (!isModelRecord(model)) {
          throw new PermanentJobError(
            "Invalid job payload: expected taskInput.model to be a ModelRecord (jobs do not accept model name strings)"
          );
        }
        if (context.signal?.aborted) {
          throw new AbortSignalJobError("Job aborted");
        }
        return await fn(input.taskInput, model, context.updateProgress, context.signal);
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
