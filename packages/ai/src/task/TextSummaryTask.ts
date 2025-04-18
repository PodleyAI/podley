//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  Workflow,
  CreateWorkflow,
  TaskRegistry,
  JobQueueTaskConfig,
  TypeReplicateArray,
} from "@ellmers/task-graph";
import { AiTask } from "./base/AiTask";
import { Type, type Static } from "@sinclair/typebox";
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
  public static category = "Text Model";
  public static inputSchema = TextSummaryInputSchema;
  public static outputSchema = TextSummaryOutputSchema;
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

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextSummary: CreateWorkflow<TextSummaryTaskInput, TextSummaryTaskOutput, JobQueueTaskConfig>;
  }
}

Workflow.prototype.TextSummary = CreateWorkflow(TextSummaryTask);
