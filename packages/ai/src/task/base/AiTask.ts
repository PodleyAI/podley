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
  type TaskOutput,
} from "@ellmers/task-graph";
import { AiJob } from "../../job/AiJob";
import { getGlobalModelRepository } from "../../model/ModelRegistry";

/**
 * A base class for AI related tasks that run in a job queue.
 * Extends the JobQueueTask class to provide LLM-specific functionality.
 */
export class AiTask<
  ExecuteInput extends TaskInput = TaskInput,
  ExecuteOutput extends TaskOutput = TaskOutput,
  Config extends JobQueueTaskConfig = JobQueueTaskConfig,
  RunInput extends TaskInput = ExecuteInput,
  RunOutput extends TaskOutput = ExecuteOutput,
> extends JobQueueTask<ExecuteInput, ExecuteOutput, Config, RunInput, RunOutput> {
  public static type: string = "AiTask";

  /**
   * Creates a new AiTask instance
   * @param config - Configuration object for the task
   */
  constructor(input: RunInput = {} as RunInput, config: Config = {} as Config) {
    config.name ||= `${new.target.type || new.target.name}${
      input.model ? " with model " + input.model : ""
    }`;
    super(input, config);
    this.jobClass = AiJob<RunInput, RunOutput>;
  }

  // ========================================================================
  // Job creation
  // ========================================================================

  /**
   * Creates a new Job instance for the task
   * @returns Promise<Job> - The created job
   */
  async createJob(input: ExecuteInput) {
    const runtype = (this.constructor as any).runtype ?? (this.constructor as any).type;
    const modelname = input.model;
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
   * @param schema The schema to validate against
   * @param item The item to validate
   * @returns True if the item is valid, false otherwise
   */
  async validateInput(input: RunInput): Promise<boolean> {
    // do this for the side effect of populating the model repository
    if (!getGlobalModelRepository().taskModels.has(this.constructor.name)) {
      await getGlobalModelRepository().findModelsByTask(this.constructor.name);
    }
    return super.validateInput(input);
  }
}
