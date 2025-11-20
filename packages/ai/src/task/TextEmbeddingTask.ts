/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@podley/task-graph";
import { DataPortSchema, FromSchema } from "@podley/util";
import { AiTask } from "./base/AiTask";
import {
  TypedArraySchema,
  TypedArraySchemaOptions,
  TypeModel,
  TypeReplicateArray,
} from "./base/AiTaskSchemas";

const modelSchema = TypeReplicateArray(TypeModel("model:TextEmbeddingTask"));

export const TextEmbeddingInputSchema = {
  type: "object",
  properties: {
    text: TypeReplicateArray({
      type: "string",
      title: "Text",
      description: "The text to embed",
    }),
    model: modelSchema,
  },
  required: ["text", "model"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export const TextEmbeddingOutputSchema = {
  type: "object",
  properties: {
    vector: TypeReplicateArray(
      TypedArraySchema({
        title: "Vector",
        description: "The vector embedding of the text",
      })
    ),
  },
  required: ["vector"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type TextEmbeddingTaskInput = FromSchema<
  typeof TextEmbeddingInputSchema,
  TypedArraySchemaOptions
>;
export type TextEmbeddingTaskOutput = FromSchema<
  typeof TextEmbeddingOutputSchema,
  TypedArraySchemaOptions
>;

/**
 * A task that generates vector embeddings for text using a specified embedding model.
 * Embeddings are numerical representations of text that capture semantic meaning,
 * useful for similarity comparisons and semantic search.
 *
 * @extends AiTask
 */
export class TextEmbeddingTask extends AiTask<TextEmbeddingTaskInput, TextEmbeddingTaskOutput> {
  public static type = "TextEmbeddingTask";
  public static category = "AI Text Model";
  public static title = "Text Embedding";
  public static description = "Generates vector embeddings for text to capture semantic meaning";
  public static inputSchema(): DataPortSchema {
    return TextEmbeddingInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return TextEmbeddingOutputSchema as DataPortSchema;
  }
}

TaskRegistry.registerTask(TextEmbeddingTask);

/**
 * Convenience function to create and run a text embedding task.
 * @param input - Input containing text(s) and model(s) for embedding
 * @returns  Promise resolving to the generated embeddings
 */
export const TextEmbedding = async (input: TextEmbeddingTaskInput, config?: JobQueueTaskConfig) => {
  return new TextEmbeddingTask(input, config).run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    TextEmbedding: CreateWorkflow<
      TextEmbeddingTaskInput,
      TextEmbeddingTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextEmbedding = CreateWorkflow(TextEmbeddingTask);
