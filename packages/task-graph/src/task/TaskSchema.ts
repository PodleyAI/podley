//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { z } from "zod";
import type { JSONSchema7 } from "json-schema";

export function TypeReplicateArray<T extends z.ZodTypeAny>(
  type: T,
  annotations?: { description?: string }
): z.ZodUnion<[T, z.ZodArray<T>]> & { replicate: true } {
  const schema = z.union([type, z.array(type)]) as z.ZodUnion<[T, z.ZodArray<T>]> & { replicate: true };
  
  // Preserve description if provided
  if (annotations?.description) {
    schema.describe(annotations.description);
  }
  
  // Add replicate property
  (schema as any).replicate = true;
  
  // Preserve semantic if it exists
  if ((type as any).semantic) {
    (schema as any).semantic = (type as any).semantic;
  }
  
  return schema;
}

type UnwrapArrayUnion<T> = T extends Array<infer U> | infer U ? U : T;

export type DeReplicateStatic<S extends z.ZodObject<any>> = {
  [K in keyof S['shape']]: S['shape'][K] extends { replicate: true }
    ? UnwrapArrayUnion<z.infer<S['shape'][K]>>
    : z.infer<S['shape'][K]>;
};

/**
 * A JSONSchema7 object schema (excludes boolean from JSONSchema7Definition).
 * This type represents a schema that must be an object, not a boolean.
 */
export type DataPortSchema = JSONSchema7 & {
  type?: "object" | readonly ["object"];
};
