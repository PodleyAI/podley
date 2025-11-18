/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

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
    .Decode((value: unknown) => value as Uint8Array)
    .Encode((value: Uint8Array) => Buffer.from(value));

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
  const source = schemaSemantic(outputSchema);
  const target = schemaSemantic(inputSchema);
  if (!source || !target) return "static"; // No info — assume generic compatibility
  if (source === target) return "static";

  if (target.startsWith(source + ":")) return "runtime";

  return "incompatible";
}

export function forwardAnnotations(schema: TSchema, annotations: Record<string, unknown>) {
  return {
    ...(schema.title ? { title: schema.title } : {}),
    ...(schema.description ? { description: schema.description } : {}),
    ...(schema.default ? { default: schema.default } : {}),
    ...(schema["x-replicate"] ? { ["x-replicate"]: schema["x-replicate"] } : {}),
    ...(schema["x-semantic"] ? { ["x-semantic"]: schema["x-semantic"] } : {}),
    ...(schema["x-optional"] ? { ["x-optional"]: schema["x-optional"] } : {}),
    ...(schema["x-isArray"] ? { ["x-isArray"]: schema["x-isArray"] } : {}),
    ...(schema["x-isNullable"] ? { ["x-isNullable"]: schema["x-isNullable"] } : {}),
    ...annotations,
  };
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
  annotations = forwardAnnotations(schema, {
    ...(schema[OptionalKind]
      ? { optional: true, isNullable: true, default: schema.default ?? null }
      : {}),
    ...annotations,
  });

  // Check for union types (represented as 'anyOf' in the JSON schema)
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    // Separate union members into non-array and array types.
    const nonArrayMembers = schema.anyOf.filter((member: any) => member.type !== "array");
    const arrayMembers = schema.anyOf.filter(
      (member: any) => member.type === "array" && member.items
    );
    if (arrayMembers.length === 1 && nonArrayMembers.length === 1) {
      // This is for OptionalArray and ReplicatedArray
      annotations = forwardAnnotations(nonArrayMembers[0], {
        ...annotations,
        "x-isArray": true,
      });
      return {
        ...nonArrayMembers[0],
        ...annotations,
      };
    }
  }

  if (schema.anyOf) {
    // This is for Nullable
    const nullMember = schema.anyOf.find((member: any) => member.type === "null");
    if (nullMember) {
      const result = schema.anyOf.filter((member: any) => member.type !== "null");
      annotations = forwardAnnotations(result[0], {
        isNullable: true,
        default: null,
        ...annotations,
      });
      if (result.length === 1) {
        return {
          ...result[0],
          ...annotations,
        };
      }
      return {
        ...schema,
        ...annotations,
        anyOf: result,
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

  return { ...schema, ...annotations };
}

/**
 * Returns the semantic of a schema.
 * This is a convenience function that simplifies the schema and returns the semantic annotation.
 * @param schema - The schema to get the semantic of.
 * @returns The semantic of the schema if it exists, otherwise undefined.
 */
export function schemaSemantic(schema: TSchema): string | undefined {
  const simplified = simplifySchema(schema);
  return simplified["x-semantic"];
}
