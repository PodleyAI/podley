//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
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
  type TaskInput,
  TaskInvalidInputError,
  type TaskOutput,
} from "@ellmers/task-graph";
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
      input?.model ? " with model " + input?.model : ""
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
  async createJob(input: Input) {
    const runtype = (this.constructor as any).runtype ?? (this.constructor as any).type;
    const modelname = input["model"];
    if (!modelname) throw new Error("JobQueueTaskTask: No model name found");
    const model = await getGlobalModelRepository().findByName(modelname);

    if (!model) {
      throw new Error(`JobQueueTaskTask: No model ${modelname} found`);
    }
    const queue = getTaskQueueRegistry().getQueue(model.provider);
    if (!queue) {
      throw new Error(`JobQueueTaskTask: No queue for model ${model.provider}`);
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
   * @param valueType The type of the item ("model")
   * @param item The item to validate
   * @returns True if the item is valid, false otherwise
   */
  async validateInputValue(valueType: string, item: any) {
    const modelRepo = getGlobalModelRepository();

    if (valueType === "model" || valueType.startsWith("model_")) {
      const model = await modelRepo.findByName(item);
      if (!model) {
        throw new TaskInvalidInputError(`${valueType} not found: ${item}`);
      }
      const tasks = await modelRepo.findTasksByModel(item);
      const type = (this.constructor as typeof AiTask).type;
      const valid = !!tasks?.includes(type) || type === "DownloadModelTask";
      if (!valid) {
        throw new TaskInvalidInputError(`${item} not valid for ${valueType} task: ${type}`);
      }
      return valid;
    }

    return super.validateInputValue(valueType, item);
  }
}
