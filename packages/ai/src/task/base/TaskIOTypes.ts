//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

export type AnyNumberArray =
  | number[]
  | Float64Array
  | Float32Array
  | Int32Array
  | Int16Array
  | Int8Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Uint8ClampedArray
  | BigInt64Array
  | BigUint64Array;

function isNormalized(vec: AnyNumberArray, tolerance = 1e-6): boolean {
  const values =
    vec instanceof BigInt64Array || vec instanceof BigUint64Array
      ? Array.from(vec, (n) => Number(n))
      : Array.from(vec);
  const normSquared = values.reduce((acc, val) => acc + val * val, 0);
  return Math.abs(normSquared - 1) < tolerance;
}

export class ElVector<T extends AnyNumberArray = AnyNumberArray> {
  private _normalized: boolean | undefined;
  vector: T;
  constructor(vector: T, normalized?: boolean) {
    this.vector = vector;
    this._normalized = normalized;
  }
  get normalized(): boolean | undefined {
    if (this._normalized === undefined) {
      if (this.vector.length === 0) return undefined;
      this._normalized = isNormalized(this.vector);
    }
    return this._normalized;
  }
}

export type model_embedding = string;
export type model_generation = string;
export type model_question_answering = string;
export type model_rewriting = string;
export type model_classification = string;
export type model_summarization = string;
export type model_translation = string;
export type language = string;

export type model =
  | model_embedding
  | model_generation
  | model_question_answering
  | model_rewriting
  | model_classification
  | model_summarization
  | model_translation
  | model_generation
  | model_embedding;
