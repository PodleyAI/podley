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
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskInvalidInputError,
  JobQueueTaskConfig,
  RunOrReplicateTask,
} from "@ellmers/task-graph";
import { AnyNumberArray, ElVector } from "./base/TaskIOTypes";
import { ConvertAllToOptionalArray } from "@ellmers/util";
// ===============================================================================

export const similarity_fn = ["cosine", "jaccard", "hamming"] as const;

export type SimilarityTaskInput = {
  query: ElVector<Float32Array>;
  input: ElVector<Float32Array>[];
  k: number;
  similarity: (typeof similarity_fn)[number];
};

export type SimilarityTaskOutput = {
  output: ElVector<AnyNumberArray>[];
  score: number[];
};

type SimilarityTaskInputReplicate = ConvertAllToOptionalArray<SimilarityTaskInput>;
type SimilarityTaskOutputReplicate = ConvertAllToOptionalArray<SimilarityTaskOutput>;

export class SimilarityTask extends RunOrReplicateTask<
  SimilarityTaskInputReplicate,
  SimilarityTaskOutputReplicate,
  JobQueueTaskConfig
> {
  static readonly type = "SimilarityTask";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "input",
      name: "Inputs",
      valueType: "vector",
      isArray: "replicate",
    },
    {
      id: "query",
      name: "Query",
      valueType: "vector",
      isArray: "replicate",
    },
    {
      id: "k",
      name: "Top K",
      valueType: "number",
      defaultValue: 10,
      optional: true,
      isArray: "replicate",
    },
    {
      id: "similarity",
      name: "Similarity",
      valueType: "similarity_fn",
      defaultValue: "cosine",
      isArray: "replicate",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    {
      id: "output",
      name: "Ranked Outputs",
      valueType: "vector",
      isArray: true,
    },
    {
      id: "score",
      name: "Ranked Scores",
      valueType: "number",
      isArray: true,
    },
  ] as const;

  async validateInputValue(valueType: string, item: any): Promise<boolean> {
    if (valueType === "similarity_fn") {
      if (!similarity_fn.includes(item)) {
        throw new TaskInvalidInputError(
          `similarity must be one of: ${similarity_fn.join(", ")} but gave ${item}`
        );
      }
      return true;
    }
    if (valueType === "vector") {
      if (!(item instanceof ElVector)) {
        throw new TaskInvalidInputError(`vector must be an instance of ElVector: ${item}`);
      }
      return true;
    }
    return super.validateInputValue(valueType, item);
  }

  async validateInputDefinition(
    input: Partial<SimilarityTaskInput>,
    inputId: keyof SimilarityTaskInput
  ) {
    switch (inputId) {
      case "k": {
        const val = input[inputId];
        if (val !== null && val !== undefined && val <= 0) {
          throw new TaskInvalidInputError(`k must be greater than 0: ${val}`);
        }
        return true;
      }
      case "input": {
        const vectors = input[inputId];
        if (!Array.isArray(vectors)) {
          throw new TaskInvalidInputError(`input must be an array: ${vectors}`);
        }
        if (vectors.length === 0) {
          throw new TaskInvalidInputError(`input must not be empty: ${vectors}`);
        }
        const normalized = vectors[0].normalized;
        const dimensions = vectors[0].vector.length;
        for (const v of vectors) {
          if (v.normalized !== normalized) {
            throw new TaskInvalidInputError(
              `all vectors must be normalized or none: ${normalized}`
            );
          }
          if (v.vector.length !== dimensions) {
            throw new TaskInvalidInputError(
              `all vectors must have the same dimensions: ${v.vector.length} is not ${dimensions}`
            );
          }
        }
        return true;
      }
      default:
        return super.validateInputDefinition(input, inputId);
    }
  }

  async executeReactive(input: SimilarityTaskInput, output: SimilarityTaskOutput) {
    const query = input.query as ElVector<Float32Array>;
    let similarities = [];
    const fns = { cosine_similarity };
    const fnName = (input.similarity + "_similarity") as keyof typeof fns;
    const fn = fns[fnName];

    for (const embedding of input.input) {
      similarities.push({
        similarity: fn(embedding, query),
        embedding,
      });
    }
    similarities = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, input.k);

    const outputs = similarities.map((s) => s.embedding) as ElVector<AnyNumberArray>[];
    const scores = similarities.map((s) => s.similarity) as number[];
    output.output = outputs;
    output.score = scores;
    return output;
  }
}

TaskRegistry.registerTask(SimilarityTask);

export const Similarity = (input: SimilarityTaskInputReplicate, config?: JobQueueTaskConfig) => {
  return new SimilarityTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    Similarity: CreateWorkflow<
      SimilarityTaskInputReplicate,
      SimilarityTaskOutputReplicate,
      JobQueueTaskConfig
    >;
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
