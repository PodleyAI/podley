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
import { AnyNumberArray, model_embedding } from "./base/TaskIOTypes";
import { ElVector } from "./base/TaskIOTypes";

export type TextEmbeddingTaskInput = {
  text: string;
  model: model_embedding;
};
export type TextEmbeddingTaskOutput = {
  vector: ElVector<AnyNumberArray>;
};

/**
 * A task that generates vector embeddings for text using a specified embedding model.
 * Embeddings are numerical representations of text that capture semantic meaning,
 * useful for similarity comparisons and semantic search.
 *
 * @extends AiTask
 */
export class TextEmbeddingTask<
  Input extends TextEmbeddingTaskInput = TextEmbeddingTaskInput,
  Output extends TextEmbeddingTaskOutput = TextEmbeddingTaskOutput,
  Config extends JobQueueTaskConfig = JobQueueTaskConfig,
> extends AiTask<Input, Output, Config> {
  public static type = "TextEmbeddingTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "text",
      name: "Text",
      valueType: "text",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_embedding",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "vector", name: "Embedding", valueType: "vector" },
  ] as const;
}
TaskRegistry.registerTask(TextEmbeddingTask);

type TextEmbeddingCompoundTaskOutput = ConvertAllToArrays<TextEmbeddingTaskOutput>;
type TextEmbeddingCompoundTaskInput = ConvertSomeToOptionalArray<TextEmbeddingTaskInput, "model">;

/**
 * A compound task factory that creates a task capable of processing multiple texts
 * and generating embeddings in parallel
 */
export const TextEmbeddingCompoundTask = arrayTaskFactory<
  TextEmbeddingCompoundTaskInput,
  TextEmbeddingCompoundTaskOutput,
  TextEmbeddingTaskOutput
>(TextEmbeddingTask, ["model", "text"]);

/**
 * Convenience function to create and run a TextEmbeddingCompoundTask
 * @param {TextEmbeddingCompoundTaskInput} input - Input containing text(s) and model(s) for embedding
 * @returns {Promise<TextEmbeddingCompoundTaskOutput>} Promise resolving to the generated embeddings
 */
export const TextEmbedding = (input: TextEmbeddingCompoundTaskInput) => {
  if (Array.isArray(input.model) || Array.isArray(input.text)) {
    return new TextEmbeddingCompoundTask(input).run();
  } else {
    return new TextEmbeddingTask(input as TextEmbeddingTaskInput).run();
  }
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextEmbedding: CreateWorkflow<TextEmbeddingCompoundTaskInput>;
  }
}

Workflow.prototype.TextEmbedding = CreateWorkflow(TextEmbeddingCompoundTask);
