//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { type TObject, type TSchema, Type } from "@sinclair/typebox";

export const TypeOptionalArray = <T extends TSchema>(
  type: T,
  annotations: Record<string, unknown> = {}
) =>
  Type.Union([type, Type.Array(type)], {
    title: type.title,
    description: type.description,
    ...annotations,
  });

export const TypeDateTime = (annotations: Record<string, unknown> = {}) =>
  Type.String({ format: "date-time", ...annotations });

export const TypeDate = (annotations: Record<string, unknown> = {}) =>
  Type.String({ format: "date", ...annotations });

export const TypeNullable = <T extends TSchema>(T: T) => {
  return Type.Union([T, Type.Null()]);
};

export const TypeBlob = (annotations: Record<string, unknown> = {}) =>
  Type.Transform(Type.Any({ contentEncoding: "blob", ...annotations }))
    .Decode((value) => value as Uint8Array)
    .Encode((value) => Buffer.from(value));

export function areSemanticallyCompatible(
  outputSchema: TSchema,
  inputSchema: TSchema
): "static" | "runtime" | "incompatible" {
  const source = outputSchema.semantic;
  const target = inputSchema.semantic;
  if (!source || !target) return "static"; // No info — assume generic compatibility
  if (source === target) return "static";

  if (target.startsWith(source + ":")) return "runtime";

  return "incompatible";
}

/**
 * Recursively simplifies a schema.
 * If the schema is a union that contains a base type (like string)
 * and an array of that same type, the function returns the base type.
 */
export function simplifySchema(schema: TSchema): TSchema {
  if (!schema) throw new Error("Schema is required");
  // Check for union types (represented as 'anyOf' in the JSON schema)
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    // Separate union members into non-array and array types.
    const nonArrayMembers = schema.anyOf.filter((member: any) => member.type !== "array");
    const arrayMembers = schema.anyOf.filter(
      (member: any) => member.type === "array" && member.items
    );
    // For each array type, if its item type exists in the non-array members, return that base type.
    for (const arrayMember of arrayMembers) {
      const baseType = arrayMember.items.type;
      if (nonArrayMembers.some((member: any) => member.type === baseType)) {
        let result = nonArrayMembers.find((member: any) => member.type === baseType);
        result = simplifySchema(result);
        if (result) return { ...result, isArray: true };
      }
    }
  }

  if (schema.anyOf) {
    const nullMember = schema.anyOf.find((member: any) => member.type === "null");
    if (nullMember) {
      const result = schema.anyOf.filter((member: any) => member.type !== "null");
      if (result.length === 1) return { ...result[0], isNullable: true };
      return { ...schema, anyOf: result, isNullable: true };
    }
  }

  if (schema.properties && typeof schema.properties === "object") {
    const newProperties: any = {};
    for (const key in schema.properties) {
      newProperties[key] = simplifySchema(schema.properties[key]);
    }
    return { ...schema, properties: newProperties };
  }

  if (schema.type === "array" && schema.items) {
    return { ...schema, items: simplifySchema(schema.items) };
  }

  return schema;
}

function unwrap(schema: TSchema): TSchema {
  while (
    schema &&
    (schema.kind === "Optional" || schema.kind === "Readonly" || schema.kind === "ReadonlyOptional")
  ) {
    schema = schema.innerType;
  }

  return schema;
}

/**
 * Gets an annotation from a property schema, handling various nested schema types.
 * @param schema - The schema to extract the annotation from
 * @param annotation - The name of the annotation to extract
 * @returns The annotation value or undefined if not found
 */
export function getPropertyAnnotation(schema: TSchema, annotation: string): unknown {
  if (annotation in schema) {
    return schema[annotation];
  }

  // Handle Optional/Readonly wrappers
  if (
    schema.kind === "Optional" ||
    schema.kind === "Readonly" ||
    schema.kind === "ReadonlyOptional"
  ) {
    if (schema.annotations && annotation in schema.annotations) {
      return schema.annotations[annotation];
    }
    // Otherwise check the inner type
    return getPropertyAnnotation(schema.innerType, annotation);
  }

  // Handle Union types (like OptionalArray)
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    // First check if annotation exists on the union itself
    if (annotation in schema) {
      return schema[annotation];
    }
    // Then check the first non-array type in the union
    const nonArrayType = schema.anyOf.find((type: any) => type.type !== "array");
    if (nonArrayType) {
      return getPropertyAnnotation(nonArrayType, annotation);
    }
  }

  // Handle Array types
  if (schema.type === "array" && schema.items) {
    return getPropertyAnnotation(schema.items, annotation);
  }

  return undefined;
}

/**
 * Get a property from a schema by name.
 * @param schema - The schema to get the property from.
 * @param name - The name of the property to get.
 * @param item - The annotation to get from the property.
 * @returns The property value.
 */
export function getTypeProperty(
  schema: TObject,
  name: string,
  annotation: string
): string | undefined {
  let current: TSchema | undefined = schema;
  const path = name.split(".");

  let next = undefined;
  for (const key of path) {
    if (!current || current.type !== "object" || !current.properties) return undefined;
    next = current.properties[key];
    if (!next) return undefined;
    current = next;
  }

  if (!current) return undefined;
  const result = getPropertyAnnotation(current, annotation);
  return result as string | undefined;
}
