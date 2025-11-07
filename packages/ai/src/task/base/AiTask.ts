//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/**
 * @description This file contains the implementation of the JobQueueTask class and its derived classes.
 */

import {
  getTaskQueueRegistry,
  JobQueueTask,
  JobQueueTaskConfig,
  TaskConfigurationError,
  type TaskInput,
  type TaskOutput,
} from "@podley/task-graph";
import { schemaSemantic } from "@podley/util";
import { type TSchema } from "@sinclair/typebox";
import { AiJob } from "../../job/AiJob";
import { getGlobalModelRepository } from "../../model/ModelRegistry";

/**
 * A base class for AI related tasks that run in a job queue.
 * Extends the JobQueueTask class to provide LLM-specific functionality.
 */
export class AiTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends JobQueueTaskConfig = JobQueueTaskConfig,
> extends JobQueueTask<Input, Output, Config> {
  public static type: string = "AiTask";

  /**
   * Creates a new AiTask instance
   * @param config - Configuration object for the task
   */
  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    config.name ||= `${new.target.type || new.target.name}${
      input.model ? " with model " + input.model : ""
    }`;
    super(input, config);
    this.jobClass = AiJob<Input, Output>;
  }

  // ========================================================================
  // Job creation
  // ========================================================================

  /**
   * Creates a new Job instance for the task
   * @returns Promise<Job> - The created job
   */
  async createJob(input: Input & { model: string }) {
    const runtype = (this.constructor as any).runtype ?? (this.constructor as any).type;
    const modelname = input.model;
    if (!modelname) throw new TaskConfigurationError("JobQueueTask: No model name found");
    const model = await getGlobalModelRepository().findByName(modelname);

    if (!model) {
      throw new TaskConfigurationError(`JobQueueTask: No model ${modelname} found`);
    }
    const queue = getTaskQueueRegistry().getQueue(model.provider);
    if (!queue) {
      throw new TaskConfigurationError(`JobQueueTask: No queue for model ${model.provider}`);
    }
    this.config.queueName = queue.queueName;
    const job = new AiJob({
      queueName: queue.queueName,
      jobRunId: this.config.runnerId, // could be undefined
      input: {
        taskType: runtype,
        aiProvider: model.provider,
        taskInput: input,
      },
    });
    return job;
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
    // JSONSchema7ObjectDefinition can be boolean | JSONSchema7, we only handle object schemas
    if (typeof inputSchema === 'boolean') return super.validateInput(input);
    
    const modelTaskProperties = Object.entries<TSchema>((inputSchema.properties || {}) as Record<string, TSchema>).filter(
      ([key, schema]) => schemaSemantic(schema)?.startsWith("model:")
    );
    if (modelTaskProperties.length > 0) {
      const taskModels = await getGlobalModelRepository().findModelsByTask(this.type);
      for (const [key, propSchema] of modelTaskProperties) {
        let requestedModels = Array.isArray(input[key]) ? input[key] : [input[key]];
        for (const model of requestedModels) {
          const foundModel = taskModels?.find((m) => m.name === model);
          if (!foundModel) {
            throw new TaskConfigurationError(`AiTask: Missing model for "${key}" named "${model}"`);
          }
        }
      }
    }
    const modelPlainProperties = Object.entries<TSchema>((inputSchema.properties || {}) as Record<string, TSchema>).filter(
      ([key, schema]) => schemaSemantic(schema) === "model"
    );
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
    // JSONSchema7ObjectDefinition can be boolean | JSONSchema7, we only handle object schemas
    if (typeof inputSchema === 'boolean') return input;
    
    const modelTaskProperties = Object.entries<TSchema>((inputSchema.properties || {}) as Record<string, TSchema>).filter(
      ([key, schema]) => schemaSemantic(schema)?.startsWith("model:")
    );
    if (modelTaskProperties.length > 0) {
      const taskModels = await getGlobalModelRepository().findModelsByTask(this.type);
      for (const [key, propSchema] of modelTaskProperties) {
        let requestedModels = Array.isArray(input[key]) ? input[key] : [input[key]];
        let usingModels = requestedModels.filter((model: string) =>
          taskModels?.find((m) => m.name === model)
        );

        // we alter input to be the models that were found for this kind of input
        usingModels = usingModels.length > 1 ? usingModels : usingModels[0];
        (input as any)[key] = usingModels;
      }
    }
    return input;
  }
}
