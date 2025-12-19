/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrayTask,
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskError,
  TaskRegistry,
  Workflow,
} from "@workglow/task-graph";
import { DataPortSchema, FromSchema } from "@workglow/util";
import { TypedArray, TypedArraySchema, TypedArraySchemaOptions } from "./base/AiTaskSchemas";

export const SimilarityFn = {
  COSINE: "cosine",
  JACCARD: "jaccard",
  HAMMING: "hamming",
} as const;

export type SimilarityFn = (typeof SimilarityFn)[keyof typeof SimilarityFn];

const SimilarityInputSchema = {
  type: "object",
  properties: {
    query: TypedArraySchema({
      title: "Query",
      description: "Query vector to compare against",
    }),
    input: {
      type: "array",
      items: TypedArraySchema({
        title: "Input",
        description: "Array of vectors to compare against the query",
      }),
    },
    topK: {
      type: "number",
      title: "Top K",
      description: "Number of top results to return",
      minimum: 1,
      default: 10,
    },
    similarity: {
      type: "string",
      enum: Object.values(SimilarityFn),
      title: "Similarity 𝑓",
      description: "Similarity function to use for comparisons",
      default: SimilarityFn.COSINE,
    },
  },
  required: ["query", "input", "similarity"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

const SimilarityOutputSchema = {
  type: "object",
  properties: {
    output: {
      type: "array",
      items: TypedArraySchema({
        title: "Output",
        description: "Ranked output vectors",
      }),
    },
    score: {
      type: "array",
      items: {
        type: "number",
        title: "Score",
        description: "Similarity scores for each output vector",
      },
    },
  },
  required: ["output", "score"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type VectorSimilarityTaskInput = FromSchema<
  typeof SimilarityInputSchema,
  TypedArraySchemaOptions
>;
export type VectorSimilarityTaskOutput = FromSchema<
  typeof SimilarityOutputSchema,
  TypedArraySchemaOptions
>;

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

export const similarity = (input: VectorSimilarityTaskInput, config?: JobQueueTaskConfig) => {
  return new VectorSimilarityTask(input, config).run();
};

declare module "@workglow/task-graph" {
  interface Workflow {
    similarity: CreateWorkflow<
      VectorSimilarityTaskInput,
      VectorSimilarityTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.similarity = CreateWorkflow(VectorSimilarityTask);

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

  const normalized = vector.map((val) => Number(val) / mag);

  if (vector instanceof Float64Array) {
    return new Float64Array(normalized);
  }
  if (vector instanceof Float32Array) {
    return new Float32Array(normalized);
  }
  // For integer arrays and bigint[], use Float32Array since normalization produces floats
  return new Float32Array(normalized);
}
