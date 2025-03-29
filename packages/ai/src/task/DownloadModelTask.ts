//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@ellmers/task-graph";
import { getGlobalModelRepository } from "../model/ModelRegistry";
import { AiTask } from "./base/AiTask";
import { Type, type Static } from "@sinclair/typebox";
import { TypeModel, TypeOptionalArray, TypeReplicate } from "./base/TaskIOSchemas";

const DownloadModelInputSchema = Type.Object({
  model: TypeReplicate(
    TypeModel({
      title: "Model",
      description: "The model to download",
      task: "DownloadModelTask",
    })
  ),
});

const DownloadModelOutputSchema = Type.Object({
  model: TypeOptionalArray(
    TypeModel({
      title: "Model",
      description: "The model downloaded",
      task: "DownloadModelTask",
    })
  ),
});
export type DownloadModelTaskRunInput = Static<typeof DownloadModelInputSchema>;
export type DownloadModelTaskRunOutput = Static<typeof DownloadModelOutputSchema>;
export type DownloadModelTaskExecuteInput = {
  model: string;
};
export type DownloadModelTaskExecuteOutput = {
  model: string;
};
/**
 * Download a model from a remote source and cache it locally.
 *
 * @remarks
 * This task has a side effect of downloading the model and caching it locally outside of the task system
 */
export class DownloadModelTask extends AiTask<
  DownloadModelTaskExecuteInput,
  DownloadModelTaskExecuteOutput,
  JobQueueTaskConfig,
  DownloadModelTaskRunInput,
  DownloadModelTaskRunOutput
> {
  public static type = "DownloadModelTask";
  public static category = "Text Model";
  public static inputSchema = DownloadModelInputSchema;
  public static outputSchema = DownloadModelOutputSchema;

  public files: { file: string; progress: number }[] = [];

  constructor(input: DownloadModelTaskRunInput, config: JobQueueTaskConfig = {}) {
    super(input, config);
    this.on("progress", this.processProgress.bind(this));
    this.on("start", () => {
      this.files = [];
    });
  }

  /**
   * Handles progress updates for the download task
   * @param progress - The progress value (0-100)
   * @param message - The message to display
   * @param details - Additional details about the progress
   */
  processProgress(
    progress: number,
    message?: string,
    details?: { file?: string; progress: number; text?: number }
  ): void {
    if (details?.file) {
      const file = this.files.find((f) => f.file === details.file);
      if (file) {
        file.progress = details.progress;
      } else {
        this.files.push({ file: details.file, progress: details.progress });
      }
      this.progress = this.files.reduce((acc, f) => acc + f.progress, 0) / this.files.length;
    } else {
      this.progress = progress;
    }
  }

  async executeReactive(
    input: DownloadModelTaskExecuteInput,
    output: DownloadModelTaskExecuteOutput
  ): Promise<DownloadModelTaskExecuteOutput> {
    const model = await getGlobalModelRepository().findByName(input.model);
    if (model) {
      const tasks = (await getGlobalModelRepository().findTasksByModel(model.name)) || [];
      tasks.forEach((task) => {
        // output[String(task).toLowerCase()] = model.name;
      });
      output.model = model.name;
    }

    return output;
  }
}

TaskRegistry.registerTask(DownloadModelTask);

/**
 * Download a model from a remote source and cache it locally.
 *
 * @param input - Input containing model(s) to download
 * @returns Promise resolving to the downloaded model(s)
 */
export const DownloadModel = (input: DownloadModelTaskRunInput, config?: JobQueueTaskConfig) => {
  return new DownloadModelTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    DownloadModel: CreateWorkflow<
      DownloadModelTaskRunInput,
      DownloadModelTaskRunOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.DownloadModel = CreateWorkflow(DownloadModelTask);
