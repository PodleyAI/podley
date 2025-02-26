//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  Workflow,
  CreateWorkflow,
  TaskRegistry,
  ConvertAllToArrays,
  ConvertSomeToOptionalArray,
  TaskInputDefinition,
  TaskOutputDefinition,
  arrayTaskFactory,
  JobQueueTaskConfig,
} from "@ellmers/task-graph";
import { AiTask } from "./base/AiTask";
import { model_summarization } from "./base/TaskIOTypes";

export type TextSummaryTaskInput = {
  text: string;
  model: model_summarization;
};
export type TextSummaryTaskOutput = {
  text: string;
};

/**
 * This summarizes a piece of text
 */

export class TextSummaryTask extends AiTask {
  public static inputs: TaskInputDefinition[] = [
    {
      id: "text",
      name: "Text",
      valueType: "text",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_summarization",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Text", valueType: "text" },
  ] as const;
  constructor(config: JobQueueTaskConfig & { input?: TextSummaryTaskInput } = {}) {
    super(config);
  }
  declare runInputData: TextSummaryTaskInput;
  declare runOutputData: TextSummaryTaskOutput;
  declare defaults: Partial<TextSummaryTaskInput>;
  static readonly type = "TextSummaryTask";
  static readonly category = "Text Model";
}
TaskRegistry.registerTask(TextSummaryTask);

type TextSummaryCompoundTaskOutput = ConvertAllToArrays<TextSummaryTaskOutput>;

type TextSummaryCompoundTaskInput = ConvertSomeToOptionalArray<
  TextSummaryTaskInput,
  "model" | "text"
>;
export const TextSummaryCompoundTask = arrayTaskFactory<
  TextSummaryCompoundTaskInput,
  TextSummaryCompoundTaskOutput,
  TextSummaryTaskOutput
>(TextSummaryTask, ["model", "text"]);

export const TextSummary = (input: TextSummaryCompoundTaskInput) => {
  return new TextSummaryCompoundTask({ input }).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextSummary: CreateWorkflow<TextSummaryCompoundTaskInput>;
  }
}

Workflow.prototype.TextSummary = CreateWorkflow(TextSummaryCompoundTask);
