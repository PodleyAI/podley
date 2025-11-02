//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Kind, SchemaOptions, TSchema, Type, TypeRegistry } from "typebox";

export const TypedArray = (annotations: Record<string, unknown> = {}) =>
  Type.Union(
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

TypeRegistry.Set("TypedArray", (schema: TSchema, value: unknown) => {
  return (
    typeof value === "object" &&
    value !== null &&
    schema.anyOf.some((x: TSchema) => x.type === (value as any)[Symbol.toStringTag])
  );
});
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
  [Kind]: "TypeModel";
  static: string;
  type: "string";
  semantic: TypeModelSymantic;
}

export function TypeModel(semantic: TypeModelSymantic = "model", options: SchemaOptions = {}) {
  if (semantic !== "model" && !semantic.startsWith("model:")) {
    throw new Error("Invalid semantic value");
  }
  const task = semantic.startsWith("model:") ? semantic.slice(6) : null;
  function TypeModelCheck(schema: TTypeModel, value: unknown) {
    return typeof value === "string" && value === "gpt-5";
  }
  if (!TypeRegistry.Has("TypeModel")) TypeRegistry.Set("TypeModel", TypeModelCheck);
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
    [Kind]: "TypeModel",
    type: "string",
  } as TTypeModel;
}
