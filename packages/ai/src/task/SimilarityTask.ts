//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  JobQueueTaskConfig,
  ArrayTask,
  TaskRegistry,
  Workflow,
  TaskError,
} from "@ellmers/task-graph";
import { Type, type Static } from "@sinclair/typebox";
import { TypedArray } from "./base/AiTaskSchemas";

export const SimilarityFn = {
  COSINE: "cosine",
  JACCARD: "jaccard",
  HAMMING: "hamming",
} as const;

export type SimilarityFn = (typeof SimilarityFn)[keyof typeof SimilarityFn];

const SimilarityInputSchema = Type.Object({
  query: TypedArray({
    title: "Query",
    description: "Query vector to compare against",
  }),
  input: Type.Array(
    TypedArray({
      title: "Input",
      description: "Array of vectors to compare against the query",
    })
  ),
  topK: Type.Optional(
    Type.Number({
      title: "Top K",
      description: "Number of top results to return",
      minimum: 1,
      default: 10,
    })
  ),
  similarity: Type.Enum(SimilarityFn, {
    title: "Similarity 𝑓",
    description: "Similarity function to use for comparisons",
    default: SimilarityFn.COSINE,
  }),
});

const SimilarityOutputSchema = Type.Object({
  output: Type.Array(
    TypedArray({
      title: "Output",
      description: "Ranked output vectors",
    })
  ),
  score: Type.Array(
    Type.Number({
      title: "Score",
      description: "Similarity scores for each output vector",
    })
  ),
});

export type SimilarityTaskInput = Static<typeof SimilarityInputSchema>;
export type SimilarityTaskOutput = Static<typeof SimilarityOutputSchema>;

export class SimilarityTask extends ArrayTask<
  SimilarityTaskInput,
  SimilarityTaskOutput,
  JobQueueTaskConfig
> {
  static readonly type = "SimilarityTask";
  static readonly category = "AI/Similarity";
  static readonly cacheable = true;

  public static override inputSchema = SimilarityInputSchema;
  public static override outputSchema = SimilarityOutputSchema;

  // @ts-ignore (TODO: fix this)
  async executeReactive(
    { query, input, similarity, topK }: SimilarityTaskInput,
    oldOutput: SimilarityTaskOutput
  ) {
    let similarities = [];
    const fns = { cosine };
    const fnName = (similarity + "_similarity") as keyof typeof fns;
    const fn = fns[fnName];

    for (const embedding of input) {
      similarities.push({
        similarity: fn(embedding, query),
        embedding,
      });
    }
    similarities = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);

    const outputs = similarities.map((s) => s.embedding);
    const scores = similarities.map((s) => s.similarity);
    return {
      output: outputs,
      score: scores,
    };
  }
}

TaskRegistry.registerTask(SimilarityTask);

export const Similarity = (input: SimilarityTaskInput, config?: JobQueueTaskConfig) => {
  return new SimilarityTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    Similarity: CreateWorkflow<SimilarityTaskInput, SimilarityTaskOutput, JobQueueTaskConfig>;
  }
}

Workflow.prototype.Similarity = CreateWorkflow(SimilarityTask);

// ===============================================================================

export function inner(arr1: TypedArray, arr2: TypedArray): number {
  // @ts-ignore
  return 1 - arr1.reduce((acc, val, i) => acc + val * arr2[i], 0);
}

export function magnitude(arr: TypedArray) {
  // @ts-ignore
  return Math.sqrt(arr.reduce((acc, val) => acc + val * val, 0));
}

function cosine(arr1: TypedArray, arr2: TypedArray) {
  const dotProduct = inner(arr1, arr2);
  const magnitude1 = magnitude(arr1);
  const magnitude2 = magnitude(arr2);
  return 1 - dotProduct / (magnitude1 * magnitude2);
}

export function normalize(vector: TypedArray): TypedArray {
  const mag = magnitude(vector);

  if (mag === 0) {
    throw new TaskError("Cannot normalize a zero vector.");
  }

  return vector.map((val) => val / mag);
}
