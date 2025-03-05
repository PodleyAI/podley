//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskRegistry,
  Workflow,
} from "@ellmers/task-graph";
import { ConvertAllToOptionalArray } from "@ellmers/util";
import { AiTask } from "./base/AiTask";
import { model_rewriting } from "./base/TaskIOTypes";

export type TextRewriterTaskInput = {
  text: string;
  prompt: string;
  model: model_rewriting;
};
export type TextRewriterTaskOutput = {
  text: string;
};
type TextRewriterTaskInputReplicate = ConvertAllToOptionalArray<TextRewriterTaskInput>;
type TextRewriterTaskOutputReplicate = ConvertAllToOptionalArray<TextRewriterTaskOutput>;

/**
 * This is a special case of text generation that takes a prompt and text to rewrite
 */
export class TextRewriterTask extends AiTask<
  TextRewriterTaskInputReplicate,
  TextRewriterTaskOutputReplicate
> {
  public static type = "TextRewriterTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "text",
      name: "Text",
      valueType: "text",
      isArray: "replicate",
    },
    {
      id: "prompt",
      name: "Prompt",
      valueType: "text",
      isArray: "replicate",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_rewriting",
      isArray: "replicate",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Text", valueType: "text", isArray: "replicate" },
  ] as const;
}
TaskRegistry.registerTask(TextRewriterTask);

/**
 * Convenience function to run text rewriter tasks.
 * Creates and executes a TextRewriterCompoundTask with the provided input.
 * @param input The input parameters for text rewriting (text, prompt, and model)
 * @returns Promise resolving to the rewritten text output(s)
 */
export const TextRewriter = (
  input: TextRewriterTaskInputReplicate,
  config?: JobQueueTaskConfig
) => {
  return new TextRewriterTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextRewriter: CreateWorkflow<
      TextRewriterTaskInputReplicate,
      TextRewriterTaskOutputReplicate,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextRewriter = CreateWorkflow(TextRewriterTask);
