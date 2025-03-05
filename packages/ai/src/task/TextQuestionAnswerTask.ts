//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskInputDefinition,
  TaskOutputDefinition,
  arrayTaskFactory,
  TaskRegistry,
  JobQueueTaskConfig,
  Workflow,
  CreateWorkflow,
} from "@ellmers/task-graph";
import { AiTask } from "./base/AiTask";
import { model_question_answering } from "./base/TaskIOTypes";
import { ConvertAllToOptionalArray } from "@ellmers/util";
export type TextQuestionAnswerTaskInput = {
  context: string;
  question: string;
  model: model_question_answering;
};
export type TextQuestionAnswerTaskOutput = {
  text: string;
};
type TextQuestionAnswerTaskInputReplicate = ConvertAllToOptionalArray<TextQuestionAnswerTaskInput>;
type TextQuestionAnswerTaskOutputReplicate =
  ConvertAllToOptionalArray<TextQuestionAnswerTaskOutput>;

/**
 * This is a special case of text generation that takes a context and a question
 */
export class TextQuestionAnswerTask extends AiTask<
  TextQuestionAnswerTaskInputReplicate,
  TextQuestionAnswerTaskOutputReplicate,
  JobQueueTaskConfig
> {
  public static type = "TextQuestionAnswerTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "context",
      name: "Context",
      valueType: "text",
      isArray: "replicate",
    },
    {
      id: "question",
      name: "Question",
      valueType: "text",
      isArray: "replicate",
    },
    {
      id: "model",
      name: "Model",
      valueType: "text_model_question_answering",
      isArray: "replicate",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Answer", valueType: "text", isArray: "replicate" },
  ] as const;
}

TaskRegistry.registerTask(TextQuestionAnswerTask);

/**
 * Convenience function to run text question answer tasks.
 * Creates and executes a TextQuestionAnswerCompoundTask with the provided input.
 * @param input The input parameters for text question answer (context, question, and model)
 * @returns Promise resolving to the generated answer(s)
 */
export const TextQuestionAnswer = (
  input: TextQuestionAnswerTaskInputReplicate,
  config?: JobQueueTaskConfig
) => {
  return new TextQuestionAnswerTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextQuestionAnswer: CreateWorkflow<
      TextQuestionAnswerTaskInputReplicate,
      TextQuestionAnswerTaskOutputReplicate,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextQuestionAnswer = CreateWorkflow(TextQuestionAnswerTask);
