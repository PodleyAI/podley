//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskRegistry, JobQueueTaskConfig, Workflow, CreateWorkflow } from "@ellmers/task-graph";
import { AiTask } from "./base/AiTask";
import { Type, type Static } from "@sinclair/typebox";
import { TypeModel, TypeOptionalArray, TypeReplicate } from "./base/TaskIOSchemas";

const TextQuestionAnswerInputSchema = Type.Object({
  context: TypeReplicate(
    TypeModel({
      title: "Context",
      description: "The context of the question",
    })
  ),
  question: TypeReplicate(
    Type.String({
      title: "Question",
      description: "The question to answer",
    })
  ),
  model: TypeReplicate(
    TypeModel({
      title: "Model",
      description: "The model to use for text question answer",
      task: "TextQuestionAnswerTask",
    })
  ),
});

const TextQuestionAnswerOutputSchema = Type.Object({
  text: TypeOptionalArray(
    Type.String({
      title: "Text",
      description: "The generated text",
    })
  ),
});

export type TextQuestionAnswerTaskInput = Static<typeof TextQuestionAnswerInputSchema>;
export type TextQuestionAnswerTaskOutput = Static<typeof TextQuestionAnswerOutputSchema>;

/**
 * This is a special case of text generation that takes a context and a question
 */
export class TextQuestionAnswerTask extends AiTask<
  TextQuestionAnswerTaskInput,
  TextQuestionAnswerTaskOutput,
  JobQueueTaskConfig
> {
  public static type = "TextQuestionAnswerTask";
  public static category = "Text Model";
  public static inputSchema = TextQuestionAnswerInputSchema;
  public static outputSchema = TextQuestionAnswerOutputSchema;
}

TaskRegistry.registerTask(TextQuestionAnswerTask);

/**
 * Convenience function to run text question answer tasks.
 * Creates and executes a TextQuestionAnswerCompoundTask with the provided input.
 * @param input The input parameters for text question answer (context, question, and model)
 * @returns Promise resolving to the generated answer(s)
 */
export const TextQuestionAnswer = (
  input: TextQuestionAnswerTaskInput,
  config?: JobQueueTaskConfig
) => {
  return new TextQuestionAnswerTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextQuestionAnswer: CreateWorkflow<
      TextQuestionAnswerTaskInput,
      TextQuestionAnswerTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextQuestionAnswer = CreateWorkflow(TextQuestionAnswerTask);
