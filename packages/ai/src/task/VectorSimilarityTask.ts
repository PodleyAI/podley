//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  ArrayTask,
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskError,
  TaskRegistry,
  Workflow,
  type DataPortSchema,
} from "@podley/task-graph";
import { z } from "zod";
import { TypedArray } from "./base/AiTaskSchemas";

export const SimilarityFn = {
  COSINE: "cosine",
  JACCARD: "jaccard",
  HAMMING: "hamming",
} as const;

export type SimilarityFn = (typeof SimilarityFn)[keyof typeof SimilarityFn];

const SimilarityInputSchema = z.object({
  query: TypedArray().describe("Query vector to compare against"),
  input: z.array(
    TypedArray().describe("Array of vectors to compare against the query")
  ),
  topK: z
    .number()
    .min(1)
    .default(10)
    .optional()
    .describe("Number of top results to return"),
  similarity: z
    .enum(["cosine", "jaccard", "hamming"])
    .default("cosine")
    .describe("Similarity function to use for comparisons"),
});

const SimilarityOutputSchema = z.object({
  output: z.array(
    TypedArray().describe("Ranked output vectors")
  ),
  score: z.array(
    z.number().describe("Similarity scores for each output vector")
  ),
});

export type VectorSimilarityTaskInput = z.infer<typeof SimilarityInputSchema>;
export type VectorSimilarityTaskOutput = z.infer<typeof SimilarityOutputSchema>;

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

  public static override inputSchema(): DataPortSchema {
    return SimilarityInputSchema as DataPortSchema;
  }
  public static override outputSchema(): DataPortSchema {
    return SimilarityOutputSchema as DataPortSchema;
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
