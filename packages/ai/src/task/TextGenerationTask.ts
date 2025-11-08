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
import { z } from "zod";
import { AiTask } from "./base/AiTask";
import { TypeModel } from "./base/AiTaskSchemas";

export const TextGenerationInputSchema = z.object({
  model: TypeReplicateArray(TypeModel("model:TextGenerationTask")),
  prompt: TypeReplicateArray(
    z.string().describe("The prompt to generate text from")
  ),
  maxTokens: z
    .number()
    .min(1)
    .max(4096)
    .optional()
    .describe("The maximum number of tokens to generate"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("The temperature to use for sampling"),
  topP: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("The top-p value to use for sampling"),
  frequencyPenalty: z
    .number()
    .min(-2)
    .max(2)
    .optional()
    .describe("The frequency penalty to use"),
  presencePenalty: z
    .number()
    .min(-2)
    .max(2)
    .optional()
    .describe("The presence penalty to use"),
});

export const TextGenerationOutputSchema = z.object({
  text: TypeOptionalArray(
    z.string().describe("The generated text")
  ),
});

export type TextGenerationTaskInput = z.infer<typeof TextGenerationInputSchema>;
export type TextGenerationTaskOutput = z.infer<typeof TextGenerationOutputSchema>;

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
