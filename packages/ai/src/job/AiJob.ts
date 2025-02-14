import { Job, JobStatus } from "@ellmers/job-queue";
import { TaskInput, TaskOutput } from "@ellmers/task-graph";
import { getAiProviderRegistry } from "../provider/AiProviderRegistry";

/**
 * Input data for the AiJob
 */
interface AiProviderInput<Input extends TaskInput = TaskInput> {
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
  execute(signal?: AbortSignal): Promise<Output> {
    if (signal?.aborted || this.status === JobStatus.ABORTING) {
      throw new Error("Abort signal aborted");
    }
    const fn =
      getAiProviderRegistry().runFnRegistry[this.input.taskType]?.[this.input.modelProvider];
    if (!fn) {
      throw new Error(
        `No run function found for task type ${this.input.taskType} and model provider ${this.input.modelProvider}`
      );
    }
    return fn(
      this as unknown as AiJob<Input, Output>,
      this.input.taskInput,
      signal
    ) as Promise<Output>;
  }
}
