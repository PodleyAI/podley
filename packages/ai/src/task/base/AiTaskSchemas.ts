/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DataPortSchemaNonBoolean,
  FromSchema,
  FromSchemaDefaultOptions,
  FromSchemaOptions,
  JsonSchema,
} from "@podley/util";

export type TypedArray =
  | Float64Array
  | Float32Array
  | Int32Array
  | Int16Array
  | Int8Array
  | Uint32Array
  | Uint16Array
  | Uint8Array
  | Uint8ClampedArray;

// Type-only value for use in deserialize patterns
const TypedArrayType = null as any as TypedArray;

const TypedArraySchemaOptions = {
  ...FromSchemaDefaultOptions,
  deserialize: [
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "BigInt" | "Float64";
    //   };
    //   output: bigint;
    // },
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "Float64Array";
    //   };
    //   output: Float64Array;
    // },
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "Float32Array";
    //   };
    //   output: Float32Array;
    // },
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "Int32Array";
    //   };
    //   output: Int32Array;
    // },
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "Int16Array";
    //   };
    //   output: Int16Array;
    // },
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "Int8Array";
    //   };
    //   output: Int8Array;
    // },
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "Uint8Array";
    //   };
    //   output: Uint8Array;
    // },
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "Uint16Array";
    //   };
    //   output: Uint16Array;
    // },
    // {
    //   pattern: {
    //     type: "number";
    //     "x-semantic": "Uint32Array";
    //   };
    //   output: Uint32Array;
    // },
    // {
    //   pattern: { type: "array"; items: { type: "number" }; "x-semantic": "Uint8ClampedArray" };
    //   output: Uint8ClampedArray;
    // },
    {
      pattern: { format: "TypedArray" },
      output: TypedArrayType,
    },
  ],
} as const satisfies FromSchemaOptions;

export type TypedArraySchemaOptions = typeof TypedArraySchemaOptions;

export const TypedArraySchema = (annotations: Record<string, unknown> = {}) =>
  ({
    oneOf: [
      {
        type: "array",
        items: { type: "number", format: "Float64" },
        title: "Float64Array",
        description: "A 64-bit floating point array",
        format: "Float64Array",
      },
      {
        type: "array",
        items: { type: "number", format: "Float32" },
        title: "Float32Array",
        description: "A 32-bit floating point array",
        format: "Float32Array",
      },
      {
        type: "array",
        items: { type: "number", format: "Int32" },
        title: "Int32Array",
        description: "A 32-bit integer array",
        format: "Int32Array",
      },
      {
        type: "array",
        items: { type: "number", format: "Int16" },
        title: "Int16Array",
        description: "A 16-bit integer array",
        format: "Int16Array",
      },
      {
        type: "array",
        items: { type: "number", format: "Int8" },
        title: "Int8Array",
      },
      {
        type: "array",
        items: { type: "number", format: "Uint8" },
        title: "Uint8Array",
        description: "A 8-bit unsigned integer array",
        format: "Uint8Array",
      },
      {
        type: "array",
        items: { type: "number", format: "Uint16" },
        title: "Uint16Array",
        description: "A 16-bit unsigned integer array",
        format: "Uint16Array",
      },
      {
        type: "array",
        items: { type: "number", format: "Uint32" },
        title: "Uint32Array",
        description: "A 32-bit unsigned integer array",
        format: "Uint32Array",
      },
      {
        type: "array",
        items: { type: "number", format: "Uint8Clamped" },
        title: "Uint8ClampedArray",
        description: "A 8-bit unsigned integer array with values clamped to 0-255",
        format: "Uint8ClampedArray",
      },
    ],
    format: "TypedArray",
    ...annotations,
  }) as const satisfies JsonSchema;

export const TypeLanguage = (annotations: Record<string, unknown> = {}) =>
  ({
    type: "string",
    title: "Language",
    description: "The language to use",
    maxLength: 2,
    minLength: 2,
    ...annotations,
  }) as const;

export type TypeModelSemantic = "model" | `model:${string}`;

export type TTypeModel = DataPortSchemaNonBoolean & {
  readonly type: "string";
  readonly format: TypeModelSemantic;
};

export function TypeModel<
  S extends TypeModelSemantic = "model",
  O extends Record<string, unknown> = {},
>(semantic: S = "model" as S, options: O = {} as O) {
  if (semantic !== "model" && !semantic.startsWith("model:")) {
    throw new Error("Invalid semantic value");
  }
  const taskName = semantic.startsWith("model:")
    ? semantic
        .slice(6)
        .replace(/Task$/, "")
        .replaceAll(/[A-Z]/g, (char) => " " + char.toLowerCase())
        .trim()
    : null;
  return {
    title: "Model",
    description: `The model ${taskName ? `for ${taskName} ` : "to use"}`,
    ...options,
    format: semantic,
    type: "string",
  } as const;
}

export const TypeReplicateArray = <T extends DataPortSchemaNonBoolean>(
  type: T,
  annotations: Record<string, unknown> = {}
) =>
  ({
    oneOf: [type, { type: "array", items: type }],
    title: type.title,
    description: type.description,
    ...(type.format ? { format: type.format } : {}),
    ...annotations,
    "x-replicate": true,
  }) as const;

export type TypedArrayFromSchema<SCHEMA extends JsonSchema> = FromSchema<
  SCHEMA,
  TypedArraySchemaOptions
>;

/**
 * Removes array types from a union, leaving only non-array types.
 * For example, `string | string[]` becomes `string`.
 * Used to extract the single-value type from schemas with x-replicate annotation.
 * Uses distributive conditional types to filter out arrays from unions.
 * Checks for both array types and types with numeric index signatures (FromSchema array output).
 * Preserves TypedArray types like Float64Array which also have numeric indices.
 */
type UnwrapArrayUnion<T> = T extends readonly any[]
  ? T extends TypedArray
    ? T
    : never
  : number extends keyof T
    ? "push" extends keyof T
      ? never
      : T
    : T;

/**
 * Transforms a schema by removing array variants from properties marked with x-replicate.
 * Properties with x-replicate use {@link TypeReplicateArray} which creates a union of
 * `T | T[]`, and this type extracts just `T`.
 */
export type DeReplicateFromSchema<S extends { properties: Record<string, any> }> = {
  [K in keyof S["properties"]]: S["properties"][K] extends { "x-replicate": true }
    ? UnwrapArrayUnion<TypedArrayFromSchema<S["properties"][K]>>
    : TypedArrayFromSchema<S["properties"][K]>;
};
