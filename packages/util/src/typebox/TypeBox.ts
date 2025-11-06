//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { z, type ZodTypeAny, type ZodObject, type ZodRawShape } from "zod";

// Type aliases to maintain compatibility with TypeBox
export type TSchema = ZodTypeAny & {
  format?: string;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  minLength?: number;
  multipleOf?: number;
  items?: TSchema;
  properties?: Record<string, TSchema>;
  semantic?: string;
  title?: string;
  description?: string;
  default?: unknown;
  replicate?: boolean;
  optional?: boolean;
  isArray?: boolean;
  isNullable?: boolean;
  type?: string;
  contentEncoding?: string;
  anyOf?: TSchema[];
};

export type TObject<T extends ZodRawShape = ZodRawShape> = ZodObject<T> & {
  properties?: T;
};

export type Static<T extends ZodTypeAny> = z.infer<T>;
export type TArray<T extends ZodTypeAny> = z.ZodArray<T> & { items?: T };
export type TUnion<T extends readonly [ZodTypeAny, ...ZodTypeAny[]]> = z.ZodUnion<T>;
export type SchemaOptions = Record<string, unknown>;
export type TAny = TSchema;
export type TNumber = TSchema;
export type TString = TSchema;

// Helper to attach metadata to a schema
function withMetadata<T extends TSchema>(schema: T, metadata: Record<string, unknown>): T {
  Object.assign(schema, metadata);
  return schema;
}

// Zod-based Type API wrapper to maintain TypeBox compatibility
export const Type = {
  Object: <T extends ZodRawShape>(properties: T, options?: any): TObject<T> => {
    const obj = z.object(properties) as TObject<T>;
    obj.properties = properties;
    obj.type = "object";
    if (options) {
      Object.assign(obj, options);
    }
    return obj;
  },
  String: (options?: any): TSchema => {
    const str = z.string() as any;
    str.type = "string";
    if (options) {
      Object.assign(str, options);
    }
    return str;
  },
  Number: (options?: any): TSchema => {
    const num = z.number() as any;
    num.type = "number";
    if (options) {
      Object.assign(num, options);
    }
    return num;
  },
  Boolean: (options?: any): TSchema => {
    const bool = z.boolean() as any;
    bool.type = "boolean";
    if (options) {
      Object.assign(bool, options);
    }
    return bool;
  },
  Array: <T extends ZodTypeAny>(items: T, options?: any): TArray<T> => {
    const arr = z.array(items) as TArray<T>;
    arr.items = items;
    arr.type = "array";
    if (options) {
      Object.assign(arr, options);
    }
    return arr;
  },
  Optional: <T extends ZodTypeAny>(schema: T): T => schema.optional() as any,
  Any: (options?: any): TSchema => {
    const any = z.any() as any;
    any.type = "any";
    if (options) {
      Object.assign(any, options);
    }
    return any;
  },
  Union: <T extends readonly [ZodTypeAny, ...ZodTypeAny[]]>(schemas: T, options?: any): TUnion<T> => {
    const union = z.union(schemas) as TUnion<T> & TSchema;
    union.anyOf = schemas as any;
    if (options) {
      Object.assign(union, options);
    }
    return union;
  },
  Null: (): TSchema => {
    const nullSchema = z.null() as any;
    nullSchema.type = "null";
    return nullSchema;
  },
  Literal: <T extends string | number | boolean>(value: T): TSchema => {
    const lit = z.literal(value) as any;
    lit.type = typeof value as string;
    return lit;
  },
  Unknown: (options?: any): TSchema => {
    const unknown = z.unknown() as any;
    unknown.type = "unknown";
    if (options) {
      Object.assign(unknown, options);
    }
    return unknown;
  },
  Unsafe: <T = any>(options?: any): TSchema => {
    const any_schema = z.any() as any;
    if (options) {
      Object.assign(any_schema, options);
    }
    return any_schema;
  },
  Transform: (schema: ZodTypeAny): any => schema as any,
};

// Compatibility constants
export const Kind = Symbol("Kind");
export const OptionalKind = Symbol("Optional");

// TypeRegistry for custom types (Zod doesn't have this, so we create a stub)
export const TypeRegistry = {
  Set: (name: string, fn: (schema: any, value: unknown) => boolean) => {
    // Store custom validators if needed
  },
  Has: (name: string) => false,
  Get: (name: string) => undefined,
};

export const TypeOptionalArray = <T extends TSchema>(
  type: T,
  annotations: Record<string, unknown> = {}
): TSchema => {
  const union = Type.Union([type, Type.Array(type)] as any) as any;
  Object.assign(union, annotations);
  return union;
};

export const TypeDateTime = (annotations: Record<string, unknown> = {}): TSchema =>
  withMetadata(z.string().datetime() as any, { format: "date-time", ...annotations });

export const TypeDate = (annotations: Record<string, unknown> = {}): TSchema =>
  withMetadata(z.string().date() as any, { format: "date", ...annotations });

export const TypeNullable = <T extends TSchema>(T: T): TSchema => {
  const union = z.union([T, z.null()]).default(null) as any;
  union.anyOf = [T, Type.Null()];
  union.default = null;
  return union;
};

export const TypeBlob = (annotations: Record<string, unknown> = {}): TSchema =>
  withMetadata(z.any().transform((value: unknown) => value as Uint8Array) as any, {
    contentEncoding: "blob",
    ...annotations,
  });

TypeRegistry.Set("TypeStringEnum", (schema: { enum: string[] }, value: unknown) => {
  return typeof value === "string" && schema.enum.includes(value);
});

export const TypeStringEnum = <T extends readonly [string, ...string[]]>(values: T): TSchema => {
  const enumSchema = z.enum(values) as any;
  enumSchema[Kind as any] = "TypeStringEnum";
  enumSchema.type = "string";
  enumSchema.enum = values;
  return enumSchema;
};

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
    ...(schema.default !== undefined ? { default: schema.default } : {}),
    ...(schema.replicate ? { replicate: schema.replicate } : {}),
    ...(schema.semantic ? { semantic: schema.semantic } : {}),
    ...(schema.optional ? { optional: schema.optional } : {}),
    ...(schema.isArray ? { isArray: schema.isArray } : {}),
    ...(schema.isNullable ? { isNullable: schema.isNullable } : {}),
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
  
  const schemaAny = schema as any;
  if (schemaAny[Kind] === "Any") {
    return schema;
  }
  
  annotations = forwardAnnotations(schema, {
    ...(schemaAny[OptionalKind]
      ? { optional: true, isNullable: true, default: schema.default ?? null }
      : {}),
    ...annotations,
  });

  // Check for union types (represented as 'anyOf')
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
        isArray: true,
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
  return simplified.semantic;
}

// TypeCompiler compatibility layer for Zod
export type TypeCheck<T extends TSchema> = {
  Check: (value: unknown) => boolean;
  Errors: (value: unknown) => IterableIterator<{ message: string; path: string }>;
};

export const TypeCompiler = {
  Compile: <T extends TSchema>(schema: T): TypeCheck<T> => {
    return {
      Check: (value: unknown) => {
        const result = schema.safeParse(value);
        return result.success;
      },
      *Errors(value: unknown) {
        const result = schema.safeParse(value);
        if (!result.success) {
          const zodError = result.error;
          for (const issue of zodError.issues) {
            yield {
              message: issue.message,
              path: '/' + issue.path.join('/'),
            };
          }
        }
      },
    };
  },
};
