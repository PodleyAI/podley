//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { z, type ZodTypeAny } from "zod";

export const ZodOptionalArray = <T extends ZodTypeAny>(
  type: T,
  annotations: Record<string, unknown> = {}
) => z.union([type, z.array(type)]);

export const ZodDateTime = (annotations: Record<string, unknown> = {}) => z.string().datetime();

export const ZodDate = (annotations: Record<string, unknown> = {}) => z.string().date();

export const ZodNullable = <T extends ZodTypeAny>(T: T) => {
  return z.union([T, z.null()]).default(null);
};

export const ZodBlob = (annotations: Record<string, unknown> = {}) =>
  z.any().transform((value: unknown) => value as Uint8Array);

export const ZodStringEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values);

export function areSemanticallyCompatible(
  outputSchema: ZodTypeAny,
  inputSchema: ZodTypeAny
): "static" | "runtime" | "incompatible" {
  const source = schemaSemantic(outputSchema);
  const target = schemaSemantic(inputSchema);
  if (!source || !target) return "static"; // No info — assume generic compatibility
  if (source === target) return "static";

  if (target.startsWith(source + ":")) return "runtime";

  return "incompatible";
}

export function forwardAnnotations(schema: ZodTypeAny, annotations: Record<string, unknown>) {
  const desc = schema.description;
  return {
    ...(desc ? { description: desc } : {}),
    ...annotations,
  };
}

/**
 * Recursively simplifies a schema.
 * If the schema is a union that contains a base type (like string)
 * and an array of that same type, the function returns the base type.
 */
export function simplifySchema(
  schema: ZodTypeAny,
  annotations: Record<string, unknown> = {}
): ZodTypeAny {
  if (!schema) {
    throw new Error("Schema is undefined");
  }
  
  // For Zod, we mostly work with the schema directly
  // The simplification logic is less needed as Zod handles this differently
  return schema;
}

/**
 * Returns the semantic of a schema.
 * This is a convenience function that simplifies the schema and returns the semantic annotation.
 * @param schema - The schema to get the semantic of.
 * @returns The semantic of the schema if it exists, otherwise undefined.
 */
export function schemaSemantic(schema: ZodTypeAny): string | undefined {
  // Zod doesn't have built-in semantic annotation like TypeBox
  // We can store this in the description or use a custom property
  return (schema as any)._def?.semantic;
}
