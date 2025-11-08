//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { z } from "zod";

export const TypeOptionalArray = <T extends z.ZodTypeAny>(
  type: T,
  annotations: { description?: string } = {}
) => {
  const schema = z.union([type, z.array(type)]);
  if (annotations.description) {
    return schema.describe(annotations.description);
  }
  return schema;
};

export const TypeDateTime = (annotations: { description?: string } = {}) => {
  const schema = z.string().datetime();
  if (annotations.description) {
    return schema.describe(annotations.description);
  }
  return schema;
};

export const TypeDate = (annotations: { description?: string } = {}) => {
  const schema = z.string().date();
  if (annotations.description) {
    return schema.describe(annotations.description);
  }
  return schema;
};

export const TypeNullable = <T extends z.ZodTypeAny>(schema: T) => {
  return schema.nullable().default(null);
};

export const TypeBlob = (annotations: { description?: string } = {}) => {
  const schema = z.instanceof(Uint8Array);
  if (annotations.description) {
    return schema.describe(annotations.description);
  }
  return schema;
};

export const TypeStringEnum = <T extends readonly [string, ...string[]]>(
  values: T
): z.ZodEnum<T> => z.enum(values);

export function areSemanticallyCompatible(
  outputSchema: z.ZodTypeAny,
  inputSchema: z.ZodTypeAny
): "static" | "runtime" | "incompatible" {
  const source = schemaSemantic(outputSchema);
  const target = schemaSemantic(inputSchema);
  if (!source || !target) return "static"; // No info — assume generic compatibility
  if (source === target) return "static";

  if (target.startsWith(source + ":")) return "runtime";

  return "incompatible";
}

export function forwardAnnotations(schema: z.ZodTypeAny, annotations: Record<string, unknown>) {
  return {
    ...(schema.description ? { description: schema.description } : {}),
    ...annotations,
  };
}

/**
 * Recursively simplifies a schema.
 * For Zod, this is less critical as Zod has a different approach to schema composition
 */
export function simplifySchema(
  schema: z.ZodTypeAny,
  annotations: Record<string, unknown> = {}
): z.ZodTypeAny {
  if (!schema) {
    throw new Error("Schema is undefined");
  }
  
  // Zod schemas are already simplified in most cases
  // This function is kept for API compatibility
  return schema;
}

/**
 * Returns the semantic of a schema.
 * This is a convenience function that simplifies the schema and returns the semantic annotation.
 * @param schema - The schema to get the semantic of.
 * @returns The semantic of the schema if it exists, otherwise undefined.
 */
export function schemaSemantic(schema: z.ZodTypeAny): string | undefined {
  // In Zod, we can use metadata or description to store semantic information
  // Check if semantic property was added to the schema
  return (schema as any).semantic;
}
