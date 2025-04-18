//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
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
