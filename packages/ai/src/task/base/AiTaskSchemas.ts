//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { SchemaOptions, TSchema, Type } from "typebox";

export const TypedArray = (annotations: Record<string, unknown> = {}) => {
  const schema = Type.Union(
    [
      Type.Unsafe<Float64Array>({ type: "Float64Array" }),
      Type.Unsafe<Float32Array>({ type: "Float32Array" }),
      Type.Unsafe<Int32Array>({ type: "Int32Array" }),
      Type.Unsafe<Int16Array>({ type: "Int16Array" }),
      Type.Unsafe<Int8Array>({ type: "Int8Array" }),
      Type.Unsafe<Uint8Array>({ type: "Uint8Array" }),
      Type.Unsafe<Uint16Array>({ type: "Uint16Array" }),
      Type.Unsafe<Uint32Array>({ type: "Uint32Array" }),
      Type.Unsafe<Uint8ClampedArray>({ type: "Uint8ClampedArray" }),
    ],
    { ...annotations }
  );
  
  // Add custom guard for TypedArray validation
  return {
    ...schema,
    "~guard": {
      check: (value: unknown) => {
        return (
          typeof value === "object" &&
          value !== null &&
          schema.anyOf.some((x: TSchema) => x.type === (value as any)[Symbol.toStringTag])
        );
      },
      errors: (value: unknown) => {
        const isValid =
          typeof value === "object" &&
          value !== null &&
          schema.anyOf.some((x: TSchema) => x.type === (value as any)[Symbol.toStringTag]);
        return isValid ? [] : [{ message: "Expected a TypedArray" }];
      },
    },
  };
};

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

export const TypeLanguage = (annotations: Record<string, unknown> = {}) =>
  Type.String({
    title: "Language",
    description: "The language to use",
    maxLength: 2,
    minLength: 2,
    ...annotations,
  });

export type TypeModelSymantic = "model" | `model:${string}`;

export interface TTypeModel extends TSchema {
  "~kind": "TypeModel";
  static: string;
  type: "string";
  semantic: TypeModelSymantic;
}

export function TypeModel(semantic: TypeModelSymantic = "model", options: SchemaOptions = {}) {
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
    semantic,
    "~kind": "TypeModel",
    type: "string",
    "~guard": {
      check: (value: unknown) => typeof value === "string" && value === "gpt-5",
      errors: (value: unknown) => 
        typeof value === "string" && value === "gpt-5" 
          ? [] 
          : [{ message: "Expected a valid model string" }],
    },
  } as TTypeModel;
}
