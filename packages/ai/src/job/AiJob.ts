import { AbortSignalJobError, Job, JobStatus, PermanentJobError } from "@ellmers/job-queue";
import { TaskInput, TaskOutput } from "@ellmers/task-graph";
import { getAiProviderRegistry } from "../provider/AiProviderRegistry";

/**
 * Input data for the AiJob
 */
export interface AiProviderInput<Input extends TaskInput = TaskInput> {
  taskType: string;
  modelProvider: string;
  taskInput: Input;
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
  async execute(signal: AbortSignal): Promise<Output> {
    if (signal?.aborted || this.status === JobStatus.ABORTING) {
      throw new AbortSignalJobError("Abort signal aborted before execution of job");
    }
    const fn = getAiProviderRegistry().getDirectRunFn<Input, Output>(
      this.input.taskType,
      this.input.modelProvider
    );
    if (!fn) {
      throw new PermanentJobError(
        `No run function found for task type ${this.input.taskType} and model provider ${this.input.modelProvider}`
      );
    }
    const result = await fn(this, this.input.taskInput, signal);
    return result;
  }
}
