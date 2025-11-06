//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TSchema, Type } from "typebox";

const Kind = "~kind";
const OptionalKind = "~optional";

class TStringEnumType<T extends readonly string[]> extends Type.Base<T[number]> {
  public readonly type = "string";
  public readonly enum: [...T];
  private readonly allowed: Set<string>;

  constructor(values: [...T], annotations: Record<string, unknown> = {}) {
    super();
    this.enum = [...values] as [...T];
    this.allowed = new Set(values);
    Object.assign(this, annotations);
  }

  public override Check(value: unknown): value is T[number] {
    return typeof value === "string" && this.allowed.has(value as string);
  }
}

export const TypeOptionalArray = <T extends TSchema>(
  type: T,
  annotations: Record<string, unknown> = {}
) =>
  Type.Union([type, Type.Array(type)], {
    title: (type as any).title,
    description: (type as any).description,
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
  Type.Codec(Type.Any({ contentEncoding: "blob", ...annotations }))
    .Decode((value: unknown) => value as Uint8Array)
    .Encode((value: Uint8Array) => Buffer.from(value));

export const TypeStringEnum = <T extends readonly string[]>(
  values: [...T],
  annotations: Record<string, unknown> = {}
) => new TStringEnumType(values, annotations);

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
  const s = schema as any;
  return {
    ...(s.title ? { title: s.title } : {}),
    ...(s.description ? { description: s.description } : {}),
    ...(s.default ? { default: s.default } : {}),
    ...(s.replicate ? { replicate: s.replicate } : {}),
    ...(s.semantic ? { semantic: s.semantic } : {}),
    ...(s[OptionalKind] ? { optional: true } : {}),
    ...(s.isArray ? { isArray: s.isArray } : {}),
    ...(s.isNullable ? { isNullable: s.isNullable } : {}),
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
  const s = schema as any;
  if (s[Kind] === "Any") {
    return schema;
  }
  annotations = forwardAnnotations(schema, {
    ...(s[OptionalKind]
      ? { optional: true, isNullable: true, default: s.default ?? null }
      : {}),
    ...annotations,
  });

  // Check for union types (represented as 'anyOf' in the JSON schema)
  if (s.anyOf && Array.isArray(s.anyOf)) {
    // Separate union members into non-array and array types.
    const nonArrayMembers = s.anyOf.filter((member: any) => member.type !== "array");
    const arrayMembers = s.anyOf.filter(
      (member: any) => member.type === "array" && member.items
    );
    if (arrayMembers.length === 1 && nonArrayMembers.length === 1) {
      // This is for OptionalArray and ReplicatedArray
      annotations = forwardAnnotations(nonArrayMembers[0], {
        ...annotations,
        isArray: true,
      });
      return {
        ...nonArrayMembers[0],
        ...annotations,
      };
    }
  }

  if (s.anyOf) {
    // This is for Nullable
    const nullMember = s.anyOf.find((member: any) => member.type === "null");
    if (nullMember) {
      const result = s.anyOf.filter((member: any) => member.type !== "null");
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

  if (s.properties && typeof s.properties === "object") {
    const newProperties: any = {};
    for (const key in s.properties) {
      newProperties[key] = simplifySchema(s.properties[key], annotations);
    }
    return { ...schema, properties: newProperties };
  }

  if (s.type === "array" && s.items) {
    return { ...schema, items: simplifySchema(s.items, annotations) };
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
  return (simplified as any).semantic;
}
