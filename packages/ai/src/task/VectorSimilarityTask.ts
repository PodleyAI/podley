//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
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
  type JSONSchema7ObjectDefinition,
} from "@podley/task-graph";
import { Type, type Static, type TObject } from "@sinclair/typebox";
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

export type VectorSimilarityTaskInput = Static<typeof SimilarityInputSchema>;
export type VectorSimilarityTaskOutput = Static<typeof SimilarityOutputSchema>;

export class VectorSimilarityTask extends ArrayTask<
  VectorSimilarityTaskInput,
  VectorSimilarityTaskOutput,
  JobQueueTaskConfig
> {
  static readonly type = "VectorSimilarityTask";
  static readonly category = "Analysis";
  static readonly title = "Vector Similarity";
  public static description =
    "Compares vectors using similarity functions and returns top-K ranked results";
  static readonly cacheable = true;

  public static override inputSchema(): JSONSchema7ObjectDefinition {
    return SimilarityInputSchema as JSONSchema7ObjectDefinition;
  }
  public static override outputSchema(): JSONSchema7ObjectDefinition {
    return SimilarityOutputSchema as JSONSchema7ObjectDefinition;
  }

  // @ts-ignore (TODO: fix this)
  async executeReactive(
    { query, input, similarity, topK }: VectorSimilarityTaskInput,
    oldOutput: VectorSimilarityTaskOutput
  ) {
    let similarities = [];
    const fns = { cosine };
    const fnName = similarity as keyof typeof fns;
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

TaskRegistry.registerTask(VectorSimilarityTask);

export const Similarity = (input: VectorSimilarityTaskInput, config?: JobQueueTaskConfig) => {
  return new VectorSimilarityTask(input, config).run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    Similarity: CreateWorkflow<
      VectorSimilarityTaskInput,
      VectorSimilarityTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.Similarity = CreateWorkflow(VectorSimilarityTask);

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
