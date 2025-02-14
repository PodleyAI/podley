//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskGraphBuilder,
  TaskGraphBuilderHelper,
  TaskRegistry,
  ConvertAllToArrays,
  ConvertSomeToOptionalArray,
  arrayTaskFactory,
  TaskOutput,
  JobQueueTaskConfig,
} from "@ellmers/task-graph";
import { getGlobalModelRepository } from "../model/ModelRegistry";
import { AiTask } from "./base/AiTask";
import {
  model_embedding,
  model_generation,
  model,
  model_question_answering,
  model_summarization,
  model_translation,
  model_classification,
  model_rewriting,
} from "./base/TaskIOTypes";

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

export class DownloadModelTask extends AiTask {
  public static inputs = [
    {
      id: "model",
      name: "Model",
      valueType: "model",
    },
  ] as const;
  public static outputs = [
    {
      id: "model",
      name: "Model",
      valueType: "model",
    },
    {
      id: "dimensions",
      name: "Dimensions",
      valueType: "number",
    },
    {
      id: "normalize",
      name: "Normalize",
      valueType: "boolean",
    },
    {
      id: "model_embedding",
      name: "",
      valueType: "model_embedding",
    },
    {
      id: "model_generation",
      name: "",
      valueType: "model_generation",
    },
    {
      id: "model_summarization",
      name: "",
      valueType: "model_summarization",
    },
    {
      id: "model_question_answering",
      name: "",
      valueType: "model_question_answering",
    },
    {
      id: "model_rewriting",
      name: "",
      valueType: "model_rewriting",
    },
    {
      id: "model_translation",
      name: "",
      valueType: "model_translation",
    },
    {
      id: "model_classification",
      name: "",
      valueType: "model_classification",
    },
  ] as const;
  static sideeffects = true;
  declare runInputData: DownloadModelTaskInput;
  declare runOutputData: DownloadModelTaskOutput;
  declare defaults: Partial<DownloadModelTaskInput>;
  constructor(config: JobQueueTaskConfig & { input?: DownloadModelTaskInput } = {}) {
    super(config);
  }
  async runReactive(): Promise<TaskOutput> {
    const model = await getGlobalModelRepository().findByName(this.runInputData.model);
    if (model) {
      const tasks = (await getGlobalModelRepository().findTasksByModel(model.name)) || [];
      tasks.forEach((task) => {
        // this.runOutputData[String(task).toLowerCase()] = model.name;
      });
      this.runOutputData.model = model.name;
      this.runOutputData.dimensions = model.usingDimensions!;
      this.runOutputData.normalize = model.normalize!;
      if (tasks.includes("TextEmbeddingTask")) {
        this.runOutputData.model_embedding = model.name;
      }
      if (tasks.includes("TextGenerationTask")) {
        this.runOutputData.model_generation = model.name;
      }
      if (tasks.includes("TextSummaryTask")) {
        this.runOutputData.model_summarization = model.name;
      }
      if (tasks.includes("TextQuestionAnswerTask")) {
        this.runOutputData.model_question_answering = model.name;
      }
      if (tasks.includes("TextTranslationTask")) {
        this.runOutputData.model_translation = model.name;
      }
      if (tasks.includes("TextRewriterTask")) {
        this.runOutputData.model_rewriting = model.name;
      }
      if (tasks.includes("TextClassificationTask")) {
        this.runOutputData.model_classification = model.name;
      }
    }
    return this.runOutputData;
  }
  static readonly type = "DownloadModelTask";
  static readonly category = "Text Model";
}

TaskRegistry.registerTask(DownloadModelTask);

type DownloadModelCompoundTaskInput = ConvertSomeToOptionalArray<DownloadModelTaskInput, "model">;
export const DownloadModelCompoundTask = arrayTaskFactory<
  DownloadModelCompoundTaskInput,
  ConvertAllToArrays<DownloadModelTaskOutput>,
  DownloadModelTaskOutput
>(DownloadModelTask, ["model"]);

export const DownloadModel = (input: DownloadModelCompoundTaskInput) => {
  if (Array.isArray(input.model)) {
    return new DownloadModelCompoundTask({ input }).run();
  } else {
    return new DownloadModelTask({ input } as { input: DownloadModelTaskInput }).run();
  }
};

declare module "@ellmers/task-graph" {
  interface TaskGraphBuilder {
    DownloadModel: TaskGraphBuilderHelper<DownloadModelCompoundTaskInput>;
  }
}

TaskGraphBuilder.prototype.DownloadModel =
  TaskGraphBuilderHelper<DownloadModelCompoundTaskInput>(DownloadModelCompoundTask);
