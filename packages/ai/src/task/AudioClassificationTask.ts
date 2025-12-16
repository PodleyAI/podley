/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@workglow/task-graph";
import { DataPortSchema, FromSchema } from "@workglow/util";
import { AiAudioTask } from "./base/AiAudioTask";
import {
  DeReplicateFromSchema,
  TypeAudioInput,
  TypeCategory,
  TypeModel,
  TypeReplicateArray,
} from "./base/AiTaskSchemas";

const modelSchema = TypeReplicateArray(TypeModel("model:AudioClassificationTask"));

export const AudioClassificationInputSchema = {
  type: "object",
  properties: {
    audio: TypeReplicateArray(TypeAudioInput),
    model: modelSchema,
    categories: {
      type: "array",
      items: {
        type: "string",
      },
      title: "Categories",
      description:
        "List of candidate categories (optional, if provided uses zero-shot classification)",
      "x-ui-group": "Configuration",
    },
    maxCategories: {
      type: "number",
      minimum: 1,
      maximum: 1000,
      default: 5,
      title: "Max Categories",
      description: "The maximum number of categories to return",
      "x-ui-group": "Configuration",
    },
  },
  required: ["audio", "model"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export const AudioClassificationOutputSchema = {
  type: "object",
  properties: {
    categories: {
      oneOf: [
        { type: "array", items: TypeCategory },
        { type: "array", items: { type: "array", items: TypeCategory } },
      ],
      title: "Categories",
      description: "The classification categories with their scores",
    },
  },
  required: ["categories"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type AudioClassificationTaskInput = FromSchema<typeof AudioClassificationInputSchema>;
export type AudioClassificationTaskOutput = FromSchema<typeof AudioClassificationOutputSchema>;
export type AudioClassificationTaskExecuteInput = DeReplicateFromSchema<
  typeof AudioClassificationInputSchema
>;
export type AudioClassificationTaskExecuteOutput = DeReplicateFromSchema<
  typeof AudioClassificationOutputSchema
>;

/**
 * Classifies audio into categories using audio models.
 * Automatically selects between regular and zero-shot classification based on whether categories are provided.
 */
export class AudioClassificationTask extends AiAudioTask<
  AudioClassificationTaskInput,
  AudioClassificationTaskOutput,
  JobQueueTaskConfig
> {
  public static type = "AudioClassificationTask";
  public static category = "AI Audio Model";
  public static title = "Audio Classification";
  public static description =
    "Classifies audio into categories using audio models. Supports zero-shot classification when categories are provided.";
  public static inputSchema(): DataPortSchema {
    return AudioClassificationInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return AudioClassificationOutputSchema as DataPortSchema;
  }
}

TaskRegistry.registerTask(AudioClassificationTask);

/**
 * Convenience function to run audio classification tasks.
 * Creates and executes an AudioClassificationTask with the provided input.
 * @param input The input parameters for audio classification (audio, model, and optional categories)
 * @returns Promise resolving to the classification categories with scores
 */
export const AudioClassification = (
  input: AudioClassificationTaskInput,
  config?: JobQueueTaskConfig
) => {
  return new AudioClassificationTask(input, config).run();
};

declare module "@workglow/task-graph" {
  interface Workflow {
    AudioClassification: CreateWorkflow<
      AudioClassificationTaskInput,
      AudioClassificationTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.AudioClassification = CreateWorkflow(AudioClassificationTask);
