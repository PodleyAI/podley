/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@podley/task-graph";
import { DataPortSchema, FromSchema } from "@podley/util";
import { AiTask } from "./base/AiTask";
import { TypeModel, TypeReplicateArray } from "./base/AiTaskSchemas";

const contextSchema = {
  type: "string",
  title: "Context",
  description: "The context of the question",
} as const;

const questionSchema = {
  type: "string",
  title: "Question",
  description: "The question to answer",
} as const;

const textSchema = {
  type: "string",
  title: "Text",
  description: "The generated text",
} as const;

export const TextQuestionAnswerInputSchema = {
  type: "object",
  properties: {
    context: TypeReplicateArray(contextSchema),
    question: TypeReplicateArray(questionSchema),
    model: TypeReplicateArray(TypeModel("model:TextQuestionAnswerTask")),
  },
  required: ["context", "question", "model"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export const TextQuestionAnswerOutputSchema = {
  type: "object",
  properties: {
    text: {
      oneOf: [textSchema, { type: "array", items: textSchema }],
      title: textSchema.title,
      description: textSchema.description,
    },
  },
  required: ["text"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type TextQuestionAnswerTaskInput = FromSchema<typeof TextQuestionAnswerInputSchema>;
export type TextQuestionAnswerTaskOutput = FromSchema<typeof TextQuestionAnswerOutputSchema>;

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
