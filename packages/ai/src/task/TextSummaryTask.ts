/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskRegistry,
  TypeReplicateArray,
  Workflow,
} from "@podley/task-graph";
import { DataPortSchema } from "@podley/util";
import { Type, type Static } from "@sinclair/typebox";
import { AiTask } from "./base/AiTask";
import { TypeModel } from "./base/AiTaskSchemas";

export const TextSummaryInputSchema = Type.Object({
  text: TypeReplicateArray(
    Type.String({
      title: "Text",
      description: "The text to summarize",
    })
  ),
  model: TypeReplicateArray(TypeModel("model:TextSummaryTask")),
});

export const TextSummaryOutputSchema = Type.Object({
  text: Type.String({
    title: "Text",
    description: "The summarized text",
  }),
});

export type TextSummaryTaskInput = Static<typeof TextSummaryInputSchema>;
export type TextSummaryTaskOutput = Static<typeof TextSummaryOutputSchema>;

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
