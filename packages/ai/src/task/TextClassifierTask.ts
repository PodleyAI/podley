/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@workglow/task-graph";
import { DataPortSchema, FromSchema } from "@workglow/util";
import { AiTask } from "./base/AiTask";
import { TypeModel, TypeReplicateArray } from "./base/AiTaskSchemas";

const modelSchema = TypeReplicateArray(TypeModel("model:TextClassifierTask"));

export const TextClassifierInputSchema = {
  type: "object",
  properties: {
    text: TypeReplicateArray({
      type: "string",
      title: "Text",
      description: "The text to classify",
    }),
    maxCategories: {
      oneOf: [
        {
          type: "number",
          minimum: 1,
          maximum: 1000,
        },
        {
          type: "null",
        },
      ],
      title: "Max Categories",
      description: "The maximum number of categories to return",
    },
    model: modelSchema,
  },
  required: ["text", "model"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export const TextClassifierOutputSchema = {
  type: "object",
  properties: {
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            title: "Label",
            description: "The name of the category",
          },
          score: {
            type: "number",
            title: "Score",
            description: "The confidence score for this category",
          },
        },
        required: ["label", "score"],
        additionalProperties: false,
      },
      title: "Categories",
      description: "The classification categories with their scores",
    },
  },
  required: ["categories"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type TextClassifierTaskInput = FromSchema<typeof TextClassifierInputSchema>;
export type TextClassifierTaskOutput = FromSchema<typeof TextClassifierOutputSchema>;

/**
 * Classifies text into predefined categories using language models
 */
export class TextClassifierTask extends AiTask<TextClassifierTaskInput, TextClassifierTaskOutput> {
  public static type = "TextClassifierTask";
  public static category = "AI Text Model";
  public static title = "Text Classifier";
  public static description = "Classifies text into predefined categories using language models";
  public static inputSchema(): DataPortSchema {
    return TextClassifierInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return TextClassifierOutputSchema as DataPortSchema;
  }
}

TaskRegistry.registerTask(TextClassifierTask);

/**
 * Convenience function to run text classifier tasks.
 * Creates and executes a TextClassifierTask with the provided input.
 * @param input The input parameters for text classification (text and model)
 * @returns Promise resolving to the classification categories with scores
 */
export const TextClassifier = (input: TextClassifierTaskInput, config?: JobQueueTaskConfig) => {
  return new TextClassifierTask(input, config).run();
};

declare module "@workglow/task-graph" {
  interface Workflow {
    TextClassifier: CreateWorkflow<
      TextClassifierTaskInput,
      TextClassifierTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextClassifier = CreateWorkflow(TextClassifierTask);
