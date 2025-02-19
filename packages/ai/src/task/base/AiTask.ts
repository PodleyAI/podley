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
  type TaskOutput,
  type TaskInput,
} from "@ellmers/task-graph";
import { AiJob } from "../../job/AiJob";
import { getGlobalModelRepository } from "../../model/ModelRegistry";

/**
 * A base class for AI related tasks that run in a job queue.
 * Extends the JobQueueTask class to provide LLM-specific functionality.
 */
export class AiTask extends JobQueueTask {
  static readonly type: string = "AiTask";
  /**
   * Creates a new AiTask instance
   * @param config - Configuration object for the task
   */
  constructor(config: JobQueueTaskConfig = {}) {
    config.name ||= `${new.target.type || new.target.name}${
      config.input?.model ? " with model " + config.input?.model : ""
    }`;
    super(config);
    this.jobClass = AiJob<TaskInput, TaskOutput>;
  }

  /**
   * Creates a new Job instance for the task
   * @returns Promise<Job> - The created job
   */
  async createJob() {
    const runtype = (this.constructor as any).runtype ?? (this.constructor as any).type;
    const modelname = this.runInputData["model"];
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
      jobRunId: this.config.currentJobRunId, // could be undefined
      input: {
        taskType: runtype,
        modelProvider: model.provider,
        taskInput: this.runInputData,
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
  async validateItem(valueType: string, item: any) {
    const modelRepo = getGlobalModelRepository();

    switch (valueType) {
      case "model":
        return typeof item == "string" && !!(await modelRepo.findByName(item));
    }
    if (valueType.startsWith("model_")) {
      const tasks = await modelRepo.findTasksByModel(item);
      return !!tasks?.includes((this.constructor as typeof AiTask).type);
    }

    return super.validateItem(valueType, item);
  }

  /**
   * Processes the task output data after the main execution
   * Can be overridden by derived classes to implement reactive behavior
   * @returns Promise<TaskOutput> - The processed output data
   */
  async runReactive(): Promise<TaskOutput> {
    return this.runOutputData ?? {};
  }
}
