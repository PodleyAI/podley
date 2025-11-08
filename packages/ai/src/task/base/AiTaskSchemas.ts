//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { z } from "zod";

export const TypedArray = () =>
  z.union([
    z.instanceof(Float64Array),
    z.instanceof(Float32Array),
    z.instanceof(Int32Array),
    z.instanceof(Int16Array),
    z.instanceof(Int8Array),
    z.instanceof(Uint8Array),
    z.instanceof(Uint16Array),
    z.instanceof(Uint32Array),
    z.instanceof(Uint8ClampedArray),
  ]);

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

export const TypeLanguage = () =>
  z.string().length(2).describe("The language to use");

export type TypeModelSymantic = "model" | `model:${string}`;

export interface ZodTypeModel extends z.ZodType<string> {
  semantic: TypeModelSymantic;
}

export function TypeModel(semantic: TypeModelSymantic = "model", options: { description?: string } = {}) {
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
  
  const schema = z.string().describe(
    options.description || `The model ${taskName ? `for ${taskName} ` : "to use"}`
  );
  
  // Add semantic property to the schema
  (schema as any).semantic = semantic;
  
  return schema as ZodTypeModel;
}
