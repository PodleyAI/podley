/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@workglow/task-graph";
import { DataPortSchema, FromSchema } from "@workglow/util";
import { AiTask } from "./base/AiTask";
import { TypeModel, TypeReplicateArray } from "./base/AiTaskSchemas";

const modelSchema = TypeReplicateArray(TypeModel("model:LanguageDetectionTask"));

export const LanguageDetectionInputSchema = {
  type: "object",
  properties: {
    text: TypeReplicateArray({
      type: "string",
      title: "Text",
      description: "The text to detect the language of",
    }),
    maxLanguages: {
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
      title: "Max Languages",
      description: "The maximum number of languages to return",
    },
    model: modelSchema,
  },
  required: ["text", "model"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export const LanguageDetectionOutputSchema = {
  type: "object",
  properties: {
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          language: {
            type: "string",
            title: "Language",
            description: "The language",
          },
          score: {
            type: "number",
            title: "Score",
            description: "The confidence score for this language",
          },
        },
        required: ["language", "score"],
        additionalProperties: false,
      },
      title: "Languages",
      description: "The languages with their scores",
    },
  },
  required: ["languages"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type LanguageDetectionTaskInput = FromSchema<typeof LanguageDetectionInputSchema>;
export type LanguageDetectionTaskOutput = FromSchema<typeof LanguageDetectionOutputSchema>;

/**
 * Detects the language of text using language models
 */
export class LanguageDetectionTask extends AiTask<
  LanguageDetectionTaskInput,
  LanguageDetectionTaskOutput
> {
  public static type = "LanguageDetectionTask";
  public static category = "AI Text Model";
  public static title = "Language Detection";
  public static description = "Detects the language of text using language models";
  public static inputSchema(): DataPortSchema {
    return LanguageDetectionInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return LanguageDetectionOutputSchema as DataPortSchema;
  }
}

TaskRegistry.registerTask(LanguageDetectionTask);

/**
 * Convenience function to run language detection tasks.
 * Creates and executes a LanguageDetectionTask with the provided input.
 * @param input The input parameters for language detection (text and model)
 * @returns Promise resolving to the languages with scores
 */
export const LanguageDetection = (
  input: LanguageDetectionTaskInput,
  config?: JobQueueTaskConfig
) => {
  return new LanguageDetectionTask(input, config).run();
};

declare module "@workglow/task-graph" {
  interface Workflow {
    LanguageDetection: CreateWorkflow<
      LanguageDetectionTaskInput,
      LanguageDetectionTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.LanguageDetection = CreateWorkflow(LanguageDetectionTask);
