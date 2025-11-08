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
  type DataPortSchema,
} from "@podley/task-graph";
import { TypeOptionalArray } from "@podley/util";
import { z } from "zod";
import { AiTask } from "./base/AiTask";
import { TypeModel } from "./base/AiTaskSchemas";

export const TextQuestionAnswerInputSchema = z.object({
  context: TypeReplicateArray(
    z.string().describe("The context of the question")
  ),
  question: TypeReplicateArray(
    z.string().describe("The question to answer")
  ),
  model: TypeReplicateArray(TypeModel("model:TextQuestionAnswerTask")),
});

export const TextQuestionAnswerOutputSchema = z.object({
  text: TypeOptionalArray(
    z.string().describe("The generated text")
  ),
});

export type TextQuestionAnswerTaskInput = z.infer<typeof TextQuestionAnswerInputSchema>;
export type TextQuestionAnswerTaskOutput = z.infer<typeof TextQuestionAnswerOutputSchema>;

/**
 * This is a special case of text generation that takes a context and a question
 */
export class TextQuestionAnswerTask extends AiTask<
  TextQuestionAnswerTaskInput,
  TextQuestionAnswerTaskOutput,
  JobQueueTaskConfig
> {
  public static type = "TextQuestionAnswerTask";
  public static category = "AI Text Model";
  public static title = "Text Question Answer";
  public static description = "Answers questions based on provided context using language models";
  public static inputSchema(): DataPortSchema {
    return TextQuestionAnswerInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return TextQuestionAnswerOutputSchema as DataPortSchema;
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
