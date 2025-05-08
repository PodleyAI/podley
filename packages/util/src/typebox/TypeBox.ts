//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Kind, OptionalKind, type TSchema, Type, TypeRegistry } from "@sinclair/typebox";

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
  return Type.Union([T, Type.Null()], { default: null });
};

export const TypeBlob = (annotations: Record<string, unknown> = {}) =>
  Type.Transform(Type.Any({ contentEncoding: "blob", ...annotations }))
    .Decode((value) => value as Uint8Array)
    .Encode((value) => Buffer.from(value));

TypeRegistry.Set("TypeStringEnum", (schema: { enum: string[] }, value: unknown) => {
  return typeof value === "string" && schema.enum.includes(value);
});

export const TypeStringEnum = <T extends string[]>(values: [...T]) =>
  Type.Unsafe<T[number]>({
    [Kind]: "TypeStringEnum",
    type: "string",
    enum: values,
  });

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
export function simplifySchema(
  schema: TSchema,
  annotations: Record<string, unknown> = {}
): TSchema {
  if (!schema) {
    throw new Error("Schema is undefined");
  }
  if (schema[Kind] === "Any") {
    return schema;
  }
  annotations = {
    ...annotations,
    ...(schema[OptionalKind] ? { optional: true, isNullable: true, default: null } : {}),
    ...(schema.title ? { title: schema.title } : {}),
    ...(schema.description ? { description: schema.description } : {}),
    ...(schema.default ? { default: schema.default } : {}),
  };

  // Check for union types (represented as 'anyOf' in the JSON schema)
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    // Separate union members into non-array and array types.
    const nonArrayMembers = schema.anyOf.filter((member: any) => member.type !== "array");
    const arrayMembers = schema.anyOf.filter(
      (member: any) => member.type === "array" && member.items
    );
    if (arrayMembers.length === 1 && nonArrayMembers.length === 1) {
      // This is for OptionalArray and ReplicatedArray
      return {
        ...nonArrayMembers[0],
        ...(schema.replicate ? { replicate: schema.replicate } : {}),
        ...(schema.title ? { title: schema.title } : {}),
        ...(schema.description ? { description: schema.description } : {}),
        ...(schema.default ? { default: schema.default } : {}),
        ...annotations,
        isArray: true,
      };
    }
  }

  if (schema.anyOf) {
    // This is for Nullable
    const nullMember = schema.anyOf.find((member: any) => member.type === "null");
    if (nullMember) {
      const result = schema.anyOf.filter((member: any) => member.type !== "null");
      if (result.length === 1) {
        return {
          ...result[0],
          isNullable: true,
          default: null,
          ...(schema.title ? { title: schema.title } : {}),
          ...(schema.description ? { description: schema.description } : {}),
          ...(schema.default ? { default: schema.default } : {}),
          ...annotations,
        };
      }
      return {
        ...schema,
        anyOf: result,
        isNullable: true,
        default: null,
        ...annotations,
      };
    }
  }

  if (schema.properties && typeof schema.properties === "object") {
    const newProperties: any = {};
    for (const key in schema.properties) {
      newProperties[key] = simplifySchema(schema.properties[key], annotations);
    }
    return { ...schema, properties: newProperties };
  }

  if (schema.type === "array" && schema.items) {
    return { ...schema, items: simplifySchema(schema.items, annotations) };
  }

  return schema;
}
