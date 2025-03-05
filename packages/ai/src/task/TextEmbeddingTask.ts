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
import { AnyNumberArray, ElVector, model_embedding } from "./base/TaskIOTypes";

export type TextEmbeddingTaskInput = {
  text: string;
  model: model_embedding;
};
export type TextEmbeddingTaskOutput = {
  vector: ElVector<AnyNumberArray>;
};
type TextEmbeddingTaskInputReplicate = ConvertAllToOptionalArray<TextEmbeddingTaskInput>;
type TextEmbeddingTaskOutputReplicate = ConvertAllToOptionalArray<TextEmbeddingTaskOutput>;

/**
 * A task that generates vector embeddings for text using a specified embedding model.
 * Embeddings are numerical representations of text that capture semantic meaning,
 * useful for similarity comparisons and semantic search.
 *
 * @extends AiTask
 */
export class TextEmbeddingTask extends AiTask<
  TextEmbeddingTaskInputReplicate,
  TextEmbeddingTaskOutputReplicate
> {
  public static type = "TextEmbeddingTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "text",
      name: "Text",
      valueType: "text",
      isArray: "replicate",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_embedding",
      isArray: "replicate",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "vector", name: "Embedding", valueType: "vector", isArray: "replicate" },
  ] as const;
}
TaskRegistry.registerTask(TextEmbeddingTask);

/**
 * Convenience function to create and run a text embedding task.
 * @param input - Input containing text(s) and model(s) for embedding
 * @returns  Promise resolving to the generated embeddings
 */
export const TextEmbedding = async (
  input: TextEmbeddingTaskInputReplicate,
  config?: JobQueueTaskConfig
) => {
  return new TextEmbeddingTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextEmbedding: CreateWorkflow<
      TextEmbeddingTaskInputReplicate,
      TextEmbeddingTaskOutputReplicate,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextEmbedding = CreateWorkflow(TextEmbeddingTask);
