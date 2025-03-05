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
  TaskInputDefinition,
  TaskOutputDefinition,
  JobQueueTaskConfig,
} from "@ellmers/task-graph";
import { AiTask } from "./base/AiTask";
import { model_summarization } from "./base/TaskIOTypes";
import { ConvertAllToOptionalArray } from "@ellmers/util";

export type TextSummaryTaskInput = {
  text: string;
  model: model_summarization;
};
export type TextSummaryTaskOutput = {
  text: string;
};
type TextSummaryTaskInputReplicate = ConvertAllToOptionalArray<TextSummaryTaskInput>;
type TextSummaryTaskOutputReplicate = ConvertAllToOptionalArray<TextSummaryTaskOutput>;

/**
 * This summarizes a piece of text
 */

export class TextSummaryTask extends AiTask<
  TextSummaryTaskInputReplicate,
  TextSummaryTaskOutputReplicate
> {
  public static type = "TextSummaryTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "text",
      name: "Text",
      valueType: "text",
      isArray: "replicate",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_summarization",
      isArray: "replicate",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Text", valueType: "text", isArray: "replicate" },
  ] as const;
}
TaskRegistry.registerTask(TextSummaryTask);

/**
 * Convenience function to run text summary tasks.
 * Creates and executes a text summary task with the provided input.
 * @param input The input parameters for text summary (text and model)
 * @returns Promise resolving to the summarized text output(s)
 */
export const TextSummary = async (
  input: TextSummaryTaskInputReplicate,
  config?: JobQueueTaskConfig
) => {
  return new TextSummaryTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextSummary: CreateWorkflow<
      TextSummaryTaskInputReplicate,
      TextSummaryTaskOutputReplicate,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextSummary = CreateWorkflow(TextSummaryTask);
