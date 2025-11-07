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
import { TypeOptionalArray } from "@podley/util";
import { Type, type Static } from "@sinclair/typebox";
import { AiTask } from "./base/AiTask";
import { TypeModel } from "./base/AiTaskSchemas";

export const TextGenerationInputSchema = Type.Object({
  model: TypeReplicateArray(TypeModel("model:TextGenerationTask")),
  prompt: TypeReplicateArray(
    Type.String({
      title: "Prompt",
      description: "The prompt to generate text from",
    })
  ),
  maxTokens: Type.Optional(
    Type.Number({
      title: "Max Tokens",
      description: "The maximum number of tokens to generate",
      minimum: 1,
      maximum: 4096,
    })
  ),
  temperature: Type.Optional(
    Type.Number({
      title: "Temperature",
      description: "The temperature to use for sampling",
      minimum: 0,
      maximum: 2,
    })
  ),
  topP: Type.Optional(
    Type.Number({
      title: "Top-p",
      description: "The top-p value to use for sampling",
      minimum: 0,
      maximum: 1,
    })
  ),
  frequencyPenalty: Type.Optional(
    Type.Number({
      title: "Frequency Penalty",
      description: "The frequency penalty to use",
      minimum: -2,
      maximum: 2,
    })
  ),
  presencePenalty: Type.Optional(
    Type.Number({
      title: "Presence Penalty",
      description: "The presence penalty to use",
      minimum: -2,
      maximum: 2,
    })
  ),
});

export const TextGenerationOutputSchema = Type.Object({
  text: TypeOptionalArray(
    Type.String({
      title: "Text",
      description: "The generated text",
    })
  ),
});

export type TextGenerationTaskInput = Static<typeof TextGenerationInputSchema>;
export type TextGenerationTaskOutput = Static<typeof TextGenerationOutputSchema>;

export class TextGenerationTask extends AiTask<
  TextGenerationTaskInput,
  TextGenerationTaskOutput,
  JobQueueTaskConfig
> {
  public static type = "TextGenerationTask";
  public static category = "AI Text Model";
  public static title = "Text Generation";
  public static description =
    "Generates text from a prompt using language models with configurable parameters";
  public static inputSchema(): DataPortSchema {
    return TextGenerationInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return TextGenerationOutputSchema as DataPortSchema;
  }
}

TaskRegistry.registerTask(TextGenerationTask);
/**
 * Task for generating text using a language model
 */
export const TextGeneration = (input: TextGenerationTaskInput, config?: JobQueueTaskConfig) => {
  return new TextGenerationTask(input, config).run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    TextGeneration: CreateWorkflow<
      TextGenerationTaskInput,
      TextGenerationTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextGeneration = CreateWorkflow(TextGenerationTask);
