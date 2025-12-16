/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@workglow/task-graph";
import { DataPortSchema, FromSchema } from "@workglow/util";
import { AiTask } from "./base/AiTask";
import { DeReplicateFromSchema, TypeModel, TypeReplicateArray } from "./base/AiTaskSchemas";

const modelSchema = TypeReplicateArray(TypeModel("model:TextToAudioTask"));

const audioOutputSchema = {
  type: "object",
  properties: {
    audio: {
      type: "string",
      contentEncoding: "base64",
      contentMediaType: "audio/wav",
      title: "Generated Audio",
      description: "Base64-encoded WAV audio data",
    },
    samplingRate: {
      type: "number",
      title: "Sampling Rate",
      description: "Audio sampling rate in Hz",
    },
  },
  required: ["audio", "samplingRate"],
  additionalProperties: false,
} as const;

export const TextToAudioInputSchema = {
  type: "object",
  properties: {
    text: TypeReplicateArray({
      type: "string",
      title: "Text",
      description: "The text to convert to audio",
    }),
    model: modelSchema,
    speakerEmbeddings: {
      type: "string",
      contentEncoding: "base64",
      title: "Speaker Embeddings",
      description: "Base64-encoded speaker embeddings for voice cloning (optional)",
      "x-ui-group": "Configuration",
    },
  },
  required: ["text", "model"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export const TextToAudioOutputSchema = {
  type: "object",
  properties: {
    result: {
      oneOf: [audioOutputSchema, { type: "array", items: audioOutputSchema }],
      title: "Audio Result",
      description: "The generated audio with sampling rate",
    },
  },
  required: ["result"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type TextToAudioTaskInput = FromSchema<typeof TextToAudioInputSchema>;
export type TextToAudioTaskOutput = FromSchema<typeof TextToAudioOutputSchema>;
export type TextToAudioTaskExecuteInput = DeReplicateFromSchema<typeof TextToAudioInputSchema>;
export type TextToAudioTaskExecuteOutput = DeReplicateFromSchema<typeof TextToAudioOutputSchema>;

/**
 * Generates audio from text using text-to-speech models
 */
export class TextToAudioTask extends AiTask<TextToAudioTaskInput, TextToAudioTaskOutput> {
  public static type = "TextToAudioTask";
  public static category = "AI Audio Model";
  public static title = "Text to Audio";
  public static description = "Generates audio from text using text-to-speech models";
  public static inputSchema(): DataPortSchema {
    return TextToAudioInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return TextToAudioOutputSchema as DataPortSchema;
  }
}

TaskRegistry.registerTask(TextToAudioTask);

/**
 * Convenience function to run text to audio tasks.
 * Creates and executes a TextToAudioTask with the provided input.
 * @param input The input parameters for text to audio (text and model)
 * @returns Promise resolving to the generated audio with sampling rate
 */
export const TextToAudio = (input: TextToAudioTaskInput, config?: JobQueueTaskConfig) => {
  return new TextToAudioTask(input, config).run();
};

declare module "@workglow/task-graph" {
  interface Workflow {
    TextToAudio: CreateWorkflow<TextToAudioTaskInput, TextToAudioTaskOutput, JobQueueTaskConfig>;
  }
}

Workflow.prototype.TextToAudio = CreateWorkflow(TextToAudioTask);

