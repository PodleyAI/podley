//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskConfig,
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskRegistry,
  Workflow,
} from "@ellmers/task-graph";
import { ConvertAllToOptionalArray } from "@ellmers/util";
import { getGlobalModelRepository } from "../model/ModelRegistry";
import {
  model,
  model_classification,
  model_embedding,
  model_generation,
  model_question_answering,
  model_rewriting,
  model_summarization,
  model_translation,
} from "./base/TaskIOTypes";
import { AiTask } from "./base/AiTask";

export type DownloadModelTaskInput = {
  model: string;
};
export type DownloadModelTaskOutput = {
  model: model;
  dimensions: number;
  normalize: boolean;
  model_embedding: model_embedding;
  model_generation: model_generation;
  model_summarization: model_summarization;
  model_question_answering: model_question_answering;
  model_rewriting: model_rewriting;
  model_translation: model_translation;
  model_classification: model_classification;
};
type DownloadModelTaskInputReplicate = ConvertAllToOptionalArray<DownloadModelTaskInput>;
type DownloadModelTaskOutputReplicate = ConvertAllToOptionalArray<DownloadModelTaskOutput>;

/**
 * Download a model from a remote source and cache it locally.
 *
 * @remarks
 * This task has a side effect of downloading the model and caching it locally outside of the task system
 */
export class DownloadModelTask extends AiTask<
  DownloadModelTaskInputReplicate,
  DownloadModelTaskOutputReplicate
> {
  public static type = "DownloadModelTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "model",
      name: "Model",
      valueType: "model",
      isArray: "replicate",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    {
      id: "model",
      name: "Model",
      valueType: "model",
      isArray: "replicate",
    },
    {
      id: "dimensions",
      name: "Dimensions",
      valueType: "number",
      isArray: "replicate",
    },
    {
      id: "normalize",
      name: "Normalize",
      valueType: "boolean",
      isArray: "replicate",
    },
    {
      id: "model_embedding",
      name: "",
      valueType: "model_embedding",
      isArray: "replicate",
    },
    {
      id: "model_generation",
      name: "",
      valueType: "model_generation",
      isArray: "replicate",
    },
    {
      id: "model_summarization",
      name: "",
      valueType: "model_summarization",
      isArray: "replicate",
    },
    {
      id: "model_question_answering",
      name: "",
      valueType: "model_question_answering",
      isArray: "replicate",
    },
    {
      id: "model_rewriting",
      name: "",
      valueType: "model_rewriting",
      isArray: "replicate",
    },
    {
      id: "model_translation",
      name: "",
      valueType: "model_translation",
      isArray: "replicate",
    },
    {
      id: "model_classification",
      name: "",
      valueType: "model_classification",
      isArray: "replicate",
    },
  ] as const;
  static sideeffects = true; // the download and its cache is a side effect of the task

  public files: { file: string; progress: number }[] = [];

  /**
   * Handles progress updates for the download task
   * @param progress - The progress value (0-100)
   * @param message - The message to display
   * @param details - Additional details about the progress
   */
  handleProgress(
    progress: number,
    message: string,
    details: { file?: string; progress: number; text?: number }
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
    this.emit("progress", this.progress, message, details);
  }

  handleStart(): void {
    this.files = [];
    super.handleStart();
  }

  async executeReactive(
    input: DownloadModelTaskInput,
    output: DownloadModelTaskOutput
  ): Promise<DownloadModelTaskOutput> {
    const model = await getGlobalModelRepository().findByName(input.model);
    if (model) {
      const tasks = (await getGlobalModelRepository().findTasksByModel(model.name)) || [];
      tasks.forEach((task) => {
        // output[String(task).toLowerCase()] = model.name;
      });
      output.model = model.name;
      output.dimensions = model.usingDimensions!;
      output.normalize = model.normalize!;
      if (tasks.includes("TextEmbeddingTask")) {
        output.model_embedding = model.name;
      }
      if (tasks.includes("TextGenerationTask")) {
        output.model_generation = model.name;
      }
      if (tasks.includes("TextSummaryTask")) {
        output.model_summarization = model.name;
      }
      if (tasks.includes("TextQuestionAnswerTask")) {
        output.model_question_answering = model.name;
      }
      if (tasks.includes("TextTranslationTask")) {
        output.model_translation = model.name;
      }
      if (tasks.includes("TextRewriterTask")) {
        output.model_rewriting = model.name;
      }
      if (tasks.includes("TextClassificationTask")) {
        output.model_classification = model.name;
      }
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
export const DownloadModel = (
  input: DownloadModelTaskInputReplicate,
  config?: JobQueueTaskConfig
) => {
  return new DownloadModelTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    DownloadModel: CreateWorkflow<
      DownloadModelTaskInputReplicate,
      DownloadModelTaskOutputReplicate,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.DownloadModel = CreateWorkflow(DownloadModelTask);
