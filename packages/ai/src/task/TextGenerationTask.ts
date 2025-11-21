/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@podley/task-graph";
import { DataPortSchema, FromSchema } from "@podley/util";
import { AiTask } from "./base/AiTask";
import { TypeModel, TypeReplicateArray } from "./base/AiTaskSchemas";

const generatedTextSchema = {
  type: "string",
  title: "Text",
  description: "The generated text",
} as const;

const modelSchema = TypeReplicateArray(TypeModel("model:TextGenerationTask"));

export const TextGenerationInputSchema = {
  type: "object",
  properties: {
    model: modelSchema,
    prompt: TypeReplicateArray({
      type: "string",
      title: "Prompt",
      description: "The prompt to generate text from",
    }),
    maxTokens: {
      type: "number",
      title: "Max Tokens",
      description: "The maximum number of tokens to generate",
      minimum: 1,
      maximum: 4096,
      "x-ui-group": "Configuration",
    },
    temperature: {
      type: "number",
      title: "Temperature",
      description: "The temperature to use for sampling",
      minimum: 0,
      maximum: 2,
      "x-ui-group": "Configuration",
    },
    topP: {
      type: "number",
      title: "Top-p",
      description: "The top-p value to use for sampling",
      minimum: 0,
      maximum: 1,
      "x-ui-group": "Configuration",
    },
    frequencyPenalty: {
      type: "number",
      title: "Frequency Penalty",
      description: "The frequency penalty to use",
      minimum: -2,
      maximum: 2,
      "x-ui-group": "Configuration",
    },
    presencePenalty: {
      type: "number",
      title: "Presence Penalty",
      description: "The presence penalty to use",
      minimum: -2,
      maximum: 2,
      "x-ui-group": "Configuration",
    },
  },
  required: ["model", "prompt"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export const TextGenerationOutputSchema = {
  type: "object",
  properties: {
    text: {
      oneOf: [generatedTextSchema, { type: "array", items: generatedTextSchema }],
      title: generatedTextSchema.title,
      description: generatedTextSchema.description,
    },
  },
  required: ["text"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type TextGenerationTaskInput = FromSchema<typeof TextGenerationInputSchema>;
export type TextGenerationTaskOutput = FromSchema<typeof TextGenerationOutputSchema>;

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
