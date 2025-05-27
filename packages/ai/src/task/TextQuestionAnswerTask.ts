//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskRegistry,
  TypeReplicateArray,
  Workflow,
} from "@podley/task-graph";
import { TObject, Type, type Static } from "@sinclair/typebox";
import { AiTask } from "./base/AiTask";
import { TypeModel } from "./base/AiTaskSchemas";
import { TypeOptionalArray } from "@podley/util";

export const TextQuestionAnswerInputSchema = Type.Object({
  context: TypeReplicateArray(
    Type.String({
      title: "Context",
      description: "The context of the question",
    })
  ),
  question: TypeReplicateArray(
    Type.String({
      title: "Question",
      description: "The question to answer",
    })
  ),
  model: TypeReplicateArray(TypeModel("model:TextQuestionAnswerTask")),
});

export const TextQuestionAnswerOutputSchema = Type.Object({
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
  public static inputSchema(): TObject {
    return TextQuestionAnswerInputSchema;
  }
  public static outputSchema(): TObject {
    return TextQuestionAnswerOutputSchema;
  }
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

declare module "@podley/task-graph" {
  interface Workflow {
    TextQuestionAnswer: CreateWorkflow<
      TextQuestionAnswerTaskInput,
      TextQuestionAnswerTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextQuestionAnswer = CreateWorkflow(TextQuestionAnswerTask);
