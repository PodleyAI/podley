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
import { z } from "zod";
import { AiTask } from "./base/AiTask";
import { TypeModel } from "./base/AiTaskSchemas";

export const TextRewriterInputSchema = z.object({
  text: TypeReplicateArray(
    z.string().describe("The text to rewrite")
  ),
  prompt: TypeReplicateArray(
    z.string().describe("The prompt to direct the rewriting")
  ),
  model: TypeReplicateArray(TypeModel("model:TextRewriterTask")),
});

export const TextRewriterOutputSchema = z.object({
  text: z.string().describe("The rewritten text"),
});

export type TextRewriterTaskInput = z.infer<typeof TextRewriterInputSchema>;
export type TextRewriterTaskOutput = z.infer<typeof TextRewriterOutputSchema>;

/**
 * This is a special case of text generation that takes a prompt and text to rewrite
 */
export class TextRewriterTask extends AiTask<TextRewriterTaskInput, TextRewriterTaskOutput> {
  public static type = "TextRewriterTask";
  public static category = "AI Text Model";
  public static title = "Text Rewriter";
  public static description = "Rewrites text according to a given prompt using language models";
  public static inputSchema(): DataPortSchema {
    return TextRewriterInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return TextRewriterOutputSchema as DataPortSchema;
  }
}

TaskRegistry.registerTask(TextRewriterTask);

/**
 * Convenience function to run text rewriter tasks.
 * Creates and executes a TextRewriterCompoundTask with the provided input.
 * @param input The input parameters for text rewriting (text, prompt, and model)
 * @returns Promise resolving to the rewritten text output(s)
 */
export const TextRewriter = (input: TextRewriterTaskInput, config?: JobQueueTaskConfig) => {
  return new TextRewriterTask(input, config).run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    TextRewriter: CreateWorkflow<TextRewriterTaskInput, TextRewriterTaskOutput, JobQueueTaskConfig>;
  }
}

Workflow.prototype.TextRewriter = CreateWorkflow(TextRewriterTask);
