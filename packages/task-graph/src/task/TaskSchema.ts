//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  type TSchemaOptions,
  type Static,
  type TArray,
  type TObject,
  type TSchema,
  type TUnion,
  Type,
} from "typebox";

export function TypeReplicateArray<T extends TSchema>(
  type: T,
  annotations?: TSchemaOptions
): TUnion<[T, TArray<T>]> & { replicate: true } {
  const t = type as any;
  return Type.Union([type, Type.Array(type)], {
    title: t.title,
    description: t.description,
    ...(t.semantic ? { semantic: t.semantic } : {}),
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
