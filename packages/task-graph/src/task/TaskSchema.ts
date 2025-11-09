//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  type SchemaOptions,
  type Static,
  type TArray,
  type TObject,
  type TSchema,
  type TUnion,
  Type,
} from "@sinclair/typebox";
import type { JSONSchema7 } from "json-schema";
import type { TaskStreamReadiness } from "./TaskStream";

export function TypeReplicateArray<T extends TSchema>(
  type: T,
  annotations?: SchemaOptions
): TUnion<[T, TArray<T>]> & { "x-replicate": true } {
  return Type.Union([type, Type.Array(type)], {
    title: type.title,
    description: type.description,
    ...(type["x-semantic"] ? { ["x-semantic"]: type["x-semantic"] } : {}),
    ...(annotations as object),
    "x-replicate": true,
  }) as TUnion<[T, TArray<T>]> & { "x-replicate": true };
}

type UnwrapArrayUnion<T> = T extends Array<infer U> | infer U ? U : T;
type Properties<S extends TObject<any>> = S extends TObject<infer P> ? P : never;

export type DeReplicateStatic<S extends TObject<any>> = {
  [K in keyof Properties<S>]: Properties<S>[K] extends { "x-replicate": true }
    ? UnwrapArrayUnion<Static<Properties<S>[K]>>
    : Static<Properties<S>[K]>;
};

/**
 * DataPortSchema extends JSONSchema7 to allow custom annotations
 * starting with "x-" or "_" anywhere title and description can appear
 */
export interface DataPortSchema
  extends Omit<
    JSONSchema7,
    "properties" | "items" | "additionalProperties" | "allOf" | "anyOf" | "oneOf" | "not"
  > {
  readonly properties?: {
    readonly [key: string]: DataPortSchema;
  };
  readonly items?: DataPortSchema | readonly DataPortSchema[];
  readonly additionalProperties?: boolean | DataPortSchema;
  readonly allOf?: readonly DataPortSchema[];
  readonly anyOf?: readonly DataPortSchema[];
  readonly oneOf?: readonly DataPortSchema[];
  readonly not?: DataPortSchema;
  readonly ["x-stream"]?: DataPortStreamAnnotation;
  readonly [K: `x-${string}`]: unknown;
}

export const DATA_PORT_STREAM_METADATA_KEY = "x-stream" as const;

export interface DataPortStreamAnnotation {
  readonly streaming: true;
  readonly readiness: TaskStreamReadiness;
  readonly chunkSchema: DataPortSchema | null;
}

export function createStreamAnnotation(
  readiness: TaskStreamReadiness,
  chunkSchema: DataPortSchema | null = null
): DataPortStreamAnnotation {
  return {
    streaming: true,
    readiness,
    chunkSchema,
  };
}

export function withStreamAnnotation(
  schema: DataPortSchema,
  annotation: DataPortStreamAnnotation
): DataPortSchema {
  return {
    ...schema,
    [DATA_PORT_STREAM_METADATA_KEY]: annotation,
  };
}

export function getStreamAnnotation(schema: DataPortSchema): DataPortStreamAnnotation | null {
  const annotation = schema[DATA_PORT_STREAM_METADATA_KEY];
  if (
    annotation &&
    typeof annotation === "object" &&
    (annotation as DataPortStreamAnnotation).streaming === true
  ) {
    return annotation as DataPortStreamAnnotation;
  }
  return null;
}
