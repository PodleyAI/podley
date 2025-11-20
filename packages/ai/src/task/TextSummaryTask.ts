/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@podley/task-graph";
import { DataPortSchema, FromSchema } from "@podley/util";
import { AiTask } from "./base/AiTask";
import { TypeModel, TypeReplicateArray } from "./base/AiTaskSchemas";

const modelSchema = TypeReplicateArray(TypeModel("model:TextSummaryTask"));

export const TextSummaryInputSchema = {
  type: "object",
  properties: {
    text: TypeReplicateArray({
      type: "string",
      title: "Text",
      description: "The text to summarize",
    }),
    model: modelSchema,
  },
  required: ["text", "model"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export const TextSummaryOutputSchema = {
  type: "object",
  properties: {
    text: {
      type: "string",
      title: "Text",
      description: "The summarized text",
    },
  },
  required: ["text"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type TextSummaryTaskInput = FromSchema<typeof TextSummaryInputSchema>;
export type TextSummaryTaskOutput = FromSchema<typeof TextSummaryOutputSchema>;

/**
 * This summarizes a piece of text
 */

export class TextSummaryTask extends AiTask<TextSummaryTaskInput, TextSummaryTaskOutput> {
  public static type = "TextSummaryTask";
  public static category = "AI Text Model";
  public static title = "Text Summary";
  public static description =
    "Summarizes text into a shorter form while preserving key information";
  public static inputSchema(): DataPortSchema {
    return TextSummaryInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return TextSummaryOutputSchema as DataPortSchema;
  }
}

TaskRegistry.registerTask(TextSummaryTask);

/**
 * Convenience function to run text summary tasks.
 * Creates and executes a text summary task with the provided input.
 * @param input The input parameters for text summary (text and model)
 * @returns Promise resolving to the summarized text output(s)
 */
export const TextSummary = async (input: TextSummaryTaskInput, config?: JobQueueTaskConfig) => {
  return new TextSummaryTask(input, config).run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    TextSummary: CreateWorkflow<TextSummaryTaskInput, TextSummaryTaskOutput, JobQueueTaskConfig>;
  }
}

Workflow.prototype.TextSummary = CreateWorkflow(TextSummaryTask);
