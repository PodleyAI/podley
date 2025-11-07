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
  type JSONSchema7ObjectDefinition,
} from "@podley/task-graph";
import { TObject, Type, type Static } from "@sinclair/typebox";
import { AiTask } from "./base/AiTask";
import { TypedArray, TypeModel } from "./base/AiTaskSchemas";

export const TextEmbeddingInputSchema = Type.Object({
  text: TypeReplicateArray(
    Type.String({
      title: "Text",
      description: "The text to embed",
    })
  ),
  model: TypeReplicateArray(TypeModel("model:TextEmbeddingTask")),
});

export const TextEmbeddingOutputSchema = Type.Object({
  vector: TypeReplicateArray(
    TypedArray({
      title: "Vector",
      description: "The vector embedding of the text",
    })
  ),
});

export type TextEmbeddingTaskInput = Static<typeof TextEmbeddingInputSchema>;
export type TextEmbeddingTaskOutput = Static<typeof TextEmbeddingOutputSchema>;

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
  public static inputSchema(): JSONSchema7ObjectDefinition {
    return TextEmbeddingInputSchema as JSONSchema7ObjectDefinition;
  }
  public static outputSchema(): JSONSchema7ObjectDefinition {
    return TextEmbeddingOutputSchema as JSONSchema7ObjectDefinition;
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
