//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  ConvertAllToArrays,
  ConvertSomeToOptionalArray,
  TaskInputDefinition,
  TaskOutputDefinition,
  arrayTaskFactory,
  TaskRegistry,
  JobQueueTaskConfig,
  Workflow,
  CreateWorkflow,
} from "@ellmers/task-graph";
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

/**
 * This is a special case of text generation that takes a prompt and text to rewrite
 */

export class TextRewriterTask extends AiTask<TextRewriterTaskInput, TextRewriterTaskOutput> {
  public static type = "TextRewriterTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "text",
      name: "Text",
      valueType: "text",
    },
    {
      id: "prompt",
      name: "Prompt",
      valueType: "text",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_rewriting",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Text", valueType: "text" },
  ] as const;
}
TaskRegistry.registerTask(TextRewriterTask);

type TextRewriterCompoundTaskOutput = ConvertAllToArrays<TextRewriterTaskOutput>;

type TextRewriterCompoundTaskInput = ConvertSomeToOptionalArray<
  TextRewriterTaskInput,
  "model" | "text" | "prompt"
>;
export const TextRewriterCompoundTask = arrayTaskFactory<
  TextRewriterCompoundTaskInput,
  TextRewriterCompoundTaskOutput,
  TextRewriterTaskInput,
  TextRewriterTaskOutput,
  JobQueueTaskConfig
>(TextRewriterTask, ["model", "text", "prompt"]);

export const TextRewriter = (input: TextRewriterCompoundTaskInput) => {
  if (Array.isArray(input.model) || Array.isArray(input.text) || Array.isArray(input.prompt)) {
    return new TextRewriterCompoundTask(input).run();
  } else {
    return new TextRewriterTask(input as TextRewriterTaskInput).run();
  }
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextRewriter: CreateWorkflow<
      TextRewriterCompoundTaskInput,
      TextRewriterCompoundTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextRewriter = CreateWorkflow(TextRewriterCompoundTask);
