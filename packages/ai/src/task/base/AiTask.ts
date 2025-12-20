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
import { makeFingerprint, type JsonSchema } from "@workglow/util";

import { AiJob, AiJobInput } from "../../job/AiJob";
import { getGlobalModelRepository } from "../../model/ModelRegistry";
import type { ModelConfig, ModelRecord } from "../../model/ModelSchema";

function schemaFormat(schema: JsonSchema): string | undefined {
  return typeof schema === "object" && schema !== null && "format" in schema
    ? schema.format
    : undefined;
}

function isModelRecord(value: unknown): value is ModelRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "model_id" in value &&
    "provider" in value &&
    "tasks" in value
  );
}

function isModelConfig(value: unknown): value is ModelConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "provider" in value &&
    typeof (value as any).provider === "string" &&
    "providerConfig" in value &&
    typeof (value as any).providerConfig === "object" &&
    (value as any).providerConfig !== null
  );
}

function modelRefToLabel(model: string | ModelConfig): string {
  if (typeof model === "string") return model;
  if (typeof (model as any).model_id === "string") return (model as any).model_id;
  return `${model.provider} (inline)`;
}

export interface AiSingleTaskInput extends TaskInput {
  model: string | ModelConfig;
}

export interface AiArrayTaskInput extends TaskInput {
  model: string | ModelConfig | (string | ModelConfig)[];
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
    const modelLabel = Array.isArray(input.model)
      ? input.model.map((m) => modelRefToLabel(m as any)).join(", ")
      : input.model
        ? modelRefToLabel(input.model as any)
        : "";
    config.name ||= `${new.target.type || new.target.name}${modelLabel ? " with model " + modelLabel : ""}`;
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
    if (Array.isArray(input.model)) {
      console.error("AiTask: Model is an array", input);
      throw new TaskConfigurationError("AiTask: Model is an array, only create job for single model tasks");
    }
    const runtype = (this.constructor as any).runtype ?? (this.constructor as any).type;
    const model = await this.getModelForInput(input as AiSingleTaskInput);

    // Ensure job payload is self-contained: replace model string with resolved model config
    const taskInputWithModelConfig = {
      ...(input as any),
      model,
    } as Input & { model: ModelRecord };

    // TODO: if the queue is not memory based, we need to convert to something that can structure clone to the queue
    // const registeredQueue = await this.resolveQueue(input);
    // const queueName = registeredQueue?.server.queueName;

    return {
      taskType: runtype,
      aiProvider: model.provider,
      taskInput: taskInputWithModelConfig,
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
    const modelRef = input.model;
    if (!modelRef) throw new TaskConfigurationError("AiTask: No model found");

    if (typeof modelRef !== "string") {
      if (!isModelConfig(modelRef)) {
        throw new TaskConfigurationError("AiTask: Invalid model config (expected provider + providerConfig)");
      }

      const provider = modelRef.provider;
      const providerConfig = modelRef.providerConfig ?? {};
      const fingerprint = await makeFingerprint({ provider, providerConfig });
      const model_id = modelRef.model_id ?? `${provider}:${fingerprint}`;
      const tasks = modelRef.tasks ?? [];
      const title = modelRef.title ?? model_id;
      const description = modelRef.description ?? "";
      const metadata = modelRef.metadata ?? {};

      return {
        model_id,
        tasks,
        provider,
        providerConfig,
        title,
        description,
        metadata,
      };
    }

    const modelname = modelRef;
    if (this.modelCache && this.modelCache.name === modelname) return this.modelCache.model;

    const model = await getGlobalModelRepository().findByName(modelname);
    if (!model) throw new TaskConfigurationError(`JobQueueTask: No model ${modelname} found`);

    this.modelCache = { name: modelname, model };
    return model;
  }

  protected override async getDefaultQueueName(input: Input): Promise<string | undefined> {
    if (Array.isArray(input.model)) return undefined;
    const model = await this.getModelForInput(input as AiSingleTaskInput);
    return model.provider;
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
      for (const [key, propSchema] of modelTaskProperties) {
        let requestedModels = Array.isArray(input[key]) ? input[key] : [input[key]];
        const needsRepoLookup = requestedModels.some((m) => typeof m === "string");
        const taskModels = needsRepoLookup
          ? await getGlobalModelRepository().findModelsByTask(this.type)
          : undefined;

        for (const requested of requestedModels) {
          if (typeof requested === "string") {
            const foundModel = taskModels?.find((m) => m.model_id === requested);
            if (!foundModel) {
              throw new TaskConfigurationError(
                `AiTask: Missing model for '${key}' named '${requested}' for task '${this.type}'`
              );
            }
            continue;
          }

          if (isModelConfig(requested)) {
            // If tasks are provided, enforce compatibility; otherwise allow (tasks are repository concerns).
            if (Array.isArray((requested as any).tasks) && !(requested as any).tasks.includes(this.type)) {
              throw new TaskConfigurationError(
                `AiTask: Model config for '${key}' is not compatible with task '${this.type}'`
              );
            }
            continue;
          }

          throw new TaskConfigurationError(
            `AiTask: Invalid model value for '${key}' (expected string or model config)`
          );
        }
      }
    }

    const modelPlainProperties = Object.entries<JsonSchema>(
      (inputSchema.properties || {}) as Record<string, JsonSchema>
    ).filter(([key, schema]) => schemaFormat(schema) === "model");

    if (modelPlainProperties.length > 0) {
      for (const [key, propSchema] of modelPlainProperties) {
        let requestedModels = Array.isArray(input[key]) ? input[key] : [input[key]];
        for (const requested of requestedModels) {
          if (typeof requested === "string") {
            const foundModel = await getGlobalModelRepository().findByName(requested);
            if (!foundModel) {
              throw new TaskConfigurationError(`AiTask: Missing model for "${key}" named "${requested}"`);
            }
            continue;
          }
          if (isModelConfig(requested)) continue;
          throw new TaskConfigurationError(
            `AiTask: Invalid model value for "${key}" (expected string or model config)`
          );
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
      for (const [key, propSchema] of modelTaskProperties) {
        let requestedModels = Array.isArray(input[key]) ? input[key] : [input[key]];
        const needsRepoLookup = requestedModels.some((m) => typeof m === "string");
        const taskModels = needsRepoLookup
          ? await getGlobalModelRepository().findModelsByTask(this.type)
          : undefined;

        let usingModels = requestedModels.filter((requested: unknown) => {
          if (typeof requested === "string") {
            return Boolean(taskModels?.find((m) => m.model_id === requested));
          }
          if (isModelConfig(requested)) {
            // If tasks are absent, keep the model (cannot narrow by compatibility).
            if (!Array.isArray((requested as any).tasks)) return true;
            return Boolean((requested as any).tasks.includes(this.type));
          }
          return false;
        });

        // we alter input to be the models that were found for this kind of input
        usingModels = usingModels.length > 1 ? usingModels : usingModels[0];
        (input as any)[key] = usingModels;
      }
    }
    return input;
  }
}
