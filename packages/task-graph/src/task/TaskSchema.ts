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

export function TypeReplicateArray<T extends TSchema>(
  type: T,
  annotations?: SchemaOptions
): TUnion<[T, TArray<T>]> & { replicate: true } {
  return Type.Union([type, Type.Array(type)], {
    title: type.title,
    description: type.description,
    ...(type.semantic ? { semantic: type.semantic } : {}),
    ...(annotations as object),
    replicate: true,
  }) as any;
}

type UnwrapArrayUnion<T> = T extends Array<infer U> | infer U ? U : T;
type Properties<S extends TObject<any>> = S extends TObject<infer P> ? P : never;

export type DeReplicateStatic<S extends TObject<any>> = {
  [K in keyof Properties<S>]: Properties<S>[K] extends { replicate: true }
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
  readonly [K: `x-${string}`]: unknown;
  readonly [K: `x_${string}`]: unknown;
}
