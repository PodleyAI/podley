/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

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
