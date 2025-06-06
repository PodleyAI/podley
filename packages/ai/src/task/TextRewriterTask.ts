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

export const TextRewriterInputSchema = Type.Object({
  text: TypeReplicateArray(
    Type.String({
      title: "Text",
      description: "The text to rewrite",
    })
  ),
  prompt: TypeReplicateArray(
    Type.String({
      title: "Prompt",
      description: "The prompt to direct the rewriting",
    })
  ),
  model: TypeReplicateArray(TypeModel("model:TextRewriterTask")),
});

export const TextRewriterOutputSchema = Type.Object({
  text: Type.String({
    title: "Text",
    description: "The rewritten text",
  }),
});

export type TextRewriterTaskInput = Static<typeof TextRewriterInputSchema>;
export type TextRewriterTaskOutput = Static<typeof TextRewriterOutputSchema>;

/**
 * This is a special case of text generation that takes a prompt and text to rewrite
 */
export class TextRewriterTask extends AiTask<TextRewriterTaskInput, TextRewriterTaskOutput> {
  public static type = "TextRewriterTask";
  public static category = "Text Model";
  public static inputSchema(): TObject {
    return TextRewriterInputSchema;
  }
  public static outputSchema(): TObject {
    return TextRewriterOutputSchema;
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
