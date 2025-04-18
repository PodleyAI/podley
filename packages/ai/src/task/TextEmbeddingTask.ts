//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
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
} from "@ellmers/task-graph";
import { Type, type Static } from "@sinclair/typebox";
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
  public static category = "Text Model";
  public static inputSchema = TextEmbeddingInputSchema;
  public static outputSchema = TextEmbeddingOutputSchema;
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

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextEmbedding: CreateWorkflow<
      TextEmbeddingTaskInput,
      TextEmbeddingTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextEmbedding = CreateWorkflow(TextEmbeddingTask);
