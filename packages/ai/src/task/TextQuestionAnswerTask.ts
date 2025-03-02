//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  ConvertAllToArrays,
  ConvertSomeToOptionalArray,
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
export type TextQuestionAnswerTaskInput = {
  context: string;
  question: string;
  model: model_question_answering;
};
export type TextQuestionAnswerTaskOutput = {
  text: string;
};

/**
 * This is a special case of text generation that takes a context and a question
 */
export class TextQuestionAnswerTask extends AiTask<
  TextQuestionAnswerTaskInput,
  TextQuestionAnswerTaskOutput
> {
  public static type = "TextQuestionAnswerTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "context",
      name: "Context",
      valueType: "text",
    },
    {
      id: "question",
      name: "Question",
      valueType: "text",
    },
    {
      id: "model",
      name: "Model",
      valueType: "text_model_question_answering",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Answer", valueType: "text" },
  ] as const;
}

TaskRegistry.registerTask(TextQuestionAnswerTask);

type TextQuestionAnswerCompoundTaskOutput = ConvertAllToArrays<TextQuestionAnswerTaskOutput>;

type TextQuestionAnswerCompoundTaskInput = ConvertSomeToOptionalArray<
  TextQuestionAnswerTaskInput,
  "model" | "context" | "question"
>;

export const TextQuestionAnswerCompoundTask = arrayTaskFactory<
  TextQuestionAnswerCompoundTaskInput,
  TextQuestionAnswerCompoundTaskOutput,
  TextQuestionAnswerTaskOutput
>(TextQuestionAnswerTask, ["model", "context", "question"]);

export const TextQuestionAnswer = (input: TextQuestionAnswerCompoundTaskInput) => {
  if (Array.isArray(input.model) || Array.isArray(input.context) || Array.isArray(input.question)) {
    return new TextQuestionAnswerCompoundTask(input).run();
  } else {
    return new TextQuestionAnswerTask(input as TextQuestionAnswerTaskInput).run();
  }
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextQuestionAnswer: CreateWorkflow<TextQuestionAnswerCompoundTaskInput>;
  }
}

Workflow.prototype.TextQuestionAnswer = CreateWorkflow(TextQuestionAnswerCompoundTask);
