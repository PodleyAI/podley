/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @description This file contains the implementation of the JobQueueTask class and its derived classes.
 */

import { Job } from "@workglow/job-queue";
import {
  JobQueueTask,
  JobQueueTaskConfig,
  TaskConfigurationError,
  TaskInput,
  type TaskOutput,
} from "@workglow/task-graph";
import { type JsonSchema } from "@workglow/util";

import { AiJob, AiJobInput } from "../../job/AiJob";
import { getGlobalModelRepository } from "../../model/ModelRegistry";
import type { ModelRecord } from "../../model/ModelSchema";

function schemaFormat(schema: JsonSchema): string | undefined {
  return typeof schema === "object" && schema !== null && "format" in schema
    ? schema.format
    : undefined;
}

export interface AiSingleTaskInput extends TaskInput {
  model: string;
}

export interface AiArrayTaskInput extends TaskInput {
  model: string | ModelRecord | (string | ModelRecord)[];
}

/**
 * A base class for AI related tasks that run in a job queue.
 * Extends the JobQueueTask class to provide LLM-specific functionality.
 */
export class AiTask<
  Input extends AiArrayTaskInput = AiArrayTaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends JobQueueTaskConfig = JobQueueTaskConfig,
> extends JobQueueTask<Input, Output, Config> {
  public static type: string = "AiTask";
  private modelCache?: { name: string; model: ModelRecord };

  /**
   * Creates a new AiTask instance
   * @param config - Configuration object for the task
   */
  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    config.name ||= `${new.target.type || new.target.name}${
      input.model ? " with model " + input.model : ""
    }`;
    super(input, config);
  }

  // ========================================================================
  // Job creation
  // ========================================================================

  /**
   * Get the input to submit to the job queue.
   * Transforms the task input to AiJobInput format.
   * @param input - The task input
   * @returns The AiJobInput to submit to the queue
   */
  protected override async getJobInput(input: Input): Promise<AiJobInput<Input>> {
    if (typeof input.model !== "string") {
      console.error("AiTask: Model is not a string", input);
      throw new TaskConfigurationError(
        "AiTask: Model is not a string, only create job for single model tasks"
      );
    }
    const runtype = (this.constructor as any).runtype ?? (this.constructor as any).type;
    const model = await this.getModelForInput(input as AiSingleTaskInput);

    return {
      taskType: runtype,
      aiProvider: model.provider,
      taskInput: input as Input & { model: string },
    };
  }

  /**
   * Creates a new Job instance for direct execution (without a queue).
   * @param input - The task input
   * @param queueName - The queue name (if any)
   * @returns Promise<Job> - The created job
   */
  override async createJob(
    input: Input,
    queueName?: string
  ): Promise<Job<AiJobInput<Input>, Output>> {
    const jobInput = await this.getJobInput(input);
    const resolvedQueueName = queueName ?? (await this.getDefaultQueueName(input));
    if (!resolvedQueueName) {
      throw new TaskConfigurationError("JobQueueTask: Unable to determine queue for AI provider");
    }
    const job = new AiJob<AiJobInput<Input>, Output>({
      queueName: resolvedQueueName,
      jobRunId: this.config.runnerId, // could be undefined
      input: jobInput,
    });
    return job;
  }

  protected async getModelForInput(input: AiSingleTaskInput): Promise<ModelRecord> {
    const modelname = input.model;
    if (!modelname) throw new TaskConfigurationError("AiTask: No model name found");
    if (this.modelCache && this.modelCache.name === modelname) {
      return this.modelCache.model;
    }
    const model = await getGlobalModelRepository().findByName(modelname);
    if (!model) {
      throw new TaskConfigurationError(`JobQueueTask: No model ${modelname} found`);
    }
    this.modelCache = { name: modelname, model };
    return model;
  }

  protected override async getDefaultQueueName(input: Input): Promise<string | undefined> {
    if (typeof input.model === "string") {
      const model = await this.getModelForInput(input as AiSingleTaskInput);
      return model.provider;
    }
    return undefined;
  }

  /**
   * Validates that a model name really exists
   * @param schema The schema to validate against
   * @param item The item to validate
   * @returns True if the item is valid, false otherwise
   */
  async validateInput(input: Input): Promise<boolean> {
    // TODO(str): this is very inefficient, we should cache the results, including intermediate results
    const inputSchema = this.inputSchema();
    if (typeof inputSchema === "boolean") {
      if (inputSchema === false) {
        throw new TaskConfigurationError(`AiTask: Input schema is 'false' and accepts no inputs`);
      }
      return true;
    }
    const modelTaskProperties = Object.entries<JsonSchema>(
      (inputSchema.properties || {}) as Record<string, JsonSchema>
    ).filter(([key, schema]) => schemaFormat(schema)?.startsWith("model:"));
    if (modelTaskProperties.length > 0) {
      const taskModels = await getGlobalModelRepository().findModelsByTask(this.type);
      for (const [key, propSchema] of modelTaskProperties) {
        let requestedModels = Array.isArray(input[key]) ? input[key] : [input[key]];
        for (const model of requestedModels) {
          const foundModel = taskModels?.find((m) => m.model_id === model);
          if (!foundModel) {
            throw new TaskConfigurationError(
              `AiTask: Missing model for '${key}' named '${model}' for task '${this.type}'`
            );
          }
        }
      }
    }
    const modelPlainProperties = Object.entries<JsonSchema>(
      (inputSchema.properties || {}) as Record<string, JsonSchema>
    ).filter(([key, schema]) => schemaFormat(schema) === "model");
    if (modelPlainProperties.length > 0) {
      for (const [key, propSchema] of modelPlainProperties) {
        let requestedModels = Array.isArray(input[key]) ? input[key] : [input[key]];
        for (const model of requestedModels) {
          const foundModel = await getGlobalModelRepository().findByName(model);
          if (!foundModel) {
            throw new TaskConfigurationError(`AiTask: Missing model for "${key}" named "${model}"`);
          }
        }
      }
    }

    return super.validateInput(input);
  }

  // dataflows can strip some models that are incompatible with the target task
  // if all of them are stripped, then the task will fail in validateInput
  async narrowInput(input: Input): Promise<Input> {
    // TODO(str): this is very inefficient, we should cache the results, including intermediate results
    const inputSchema = this.inputSchema();
    if (typeof inputSchema === "boolean") {
      if (inputSchema === false) {
        throw new TaskConfigurationError(`AiTask: Input schema is 'false' and accepts no inputs`);
      }
      return input;
    }
    const modelTaskProperties = Object.entries<JsonSchema>(
      (inputSchema.properties || {}) as Record<string, JsonSchema>
    ).filter(([key, schema]) => schemaFormat(schema)?.startsWith("model:"));
    if (modelTaskProperties.length > 0) {
      const taskModels = await getGlobalModelRepository().findModelsByTask(this.type);
      for (const [key, propSchema] of modelTaskProperties) {
        let requestedModels = Array.isArray(input[key]) ? input[key] : [input[key]];
        let usingModels = requestedModels.filter((model: string) =>
          taskModels?.find((m) => m.model_id === model)
        );

        // we alter input to be the models that were found for this kind of input
        usingModels = usingModels.length > 1 ? usingModels : usingModels[0];
        (input as any)[key] = usingModels;
      }
    }
    return input;
  }
}
