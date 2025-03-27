//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskRegistry,
  Workflow,
  CreateWorkflow,
  JobQueueTaskConfig,
  RunOrReplicateTask,
} from "@ellmers/task-graph";
import { AnyNumberArray, ElVector } from "./base/TaskIOTypes";
import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";
import { TypeVector } from "./base/TaskIOSchemas";
// ===============================================================================

export enum SimilarityFn {
  COSINE = "cosine",
  JACCARD = "jaccard",
  HAMMING = "hamming",
}

const SimilarityInputSchema = Type.Object({
  query: TypeVector({
    title: "Query",
    description: "Query vector to compare against",
  }),
  input: Type.Array(
    TypeVector({
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
    title: "Similarity",
    description: "Similarity function to use for comparisons",
    default: SimilarityFn.COSINE,
  }),
});

const SimilarityOutputSchema = Type.Object({
  output: Type.Array(
    TypeVector({
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

export class SimilarityTask extends RunOrReplicateTask<
  SimilarityTaskInput,
  SimilarityTaskOutput,
  JobQueueTaskConfig
> {
  static readonly type = "SimilarityTask";
  static readonly category = "AI/Similarity";
  static readonly cacheable = true;

  public static override inputSchema = SimilarityInputSchema;
  public static override outputSchema = SimilarityOutputSchema;

  async executeReactive(input: SimilarityTaskInput, output: SimilarityTaskOutput) {
    const query = new ElVector(input.query);
    let similarities = [];
    const fns = { cosine_similarity };
    const fnName = (input.similarity + "_similarity") as keyof typeof fns;
    const fn = fns[fnName];

    // for (const embedding of input.input) {
    //   similarities.push({
    //     similarity: fn(new ElVector(embedding), query),
    //     embedding,
    //   });
    // }
    // similarities = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, input.k);

    // const outputs = similarities.map((s) => s.embedding) as ElVector<AnyNumberArray>[];
    // const scores = similarities.map((s) => s.similarity) as number[];
    // output.output = outputs;
    // output.score = scores;
    return output;
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

export function inner(arr1: number[], arr2: number[]) {
  return 1 - arr1.reduce((acc, val, i) => acc + val * arr2[i], 0);
}

export function magnitude(arr: number[]) {
  return Math.sqrt(arr.reduce((acc, val) => acc + val * val, 0));
}

function cosine(arr1: number[], arr2: number[]) {
  const dotProduct = inner(arr1, arr2);
  const magnitude1 = magnitude(arr1);
  const magnitude2 = magnitude(arr2);
  return 1 - dotProduct / (magnitude1 * magnitude2);
}

export function normalize(vector: number[]): number[] {
  const mag = magnitude(vector);

  if (mag === 0) {
    throw new Error("Cannot normalize a zero vector.");
  }

  return vector.map((val) => val / mag);
}

function cosine_similarity(
  embedding1: ElVector<Float32Array>,
  embedding2: ElVector<Float32Array>
): number {
  if (embedding1.normalized && embedding2.normalized) {
    return inner(
      embedding1.vector as unknown as number[],
      embedding2.vector as unknown as number[]
    );
  } else {
    return cosine(
      embedding1.vector as unknown as number[],
      embedding2.vector as unknown as number[]
    );
  }
}
