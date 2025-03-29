//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Static, TSchema, Type, TypeRegistry } from "@sinclair/typebox";
import { getGlobalModelRepository } from "../../model/ModelRegistry";

/**
 * Recursively simplifies a schema.
 * If the schema is a union that contains a base type (like string)
 * and an array of that same type, the function returns the base type.
 */
export function simplifySchema(schema: any): any {
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
        return nonArrayMembers.find((member: any) => member.type === baseType);
      }
    }
  }

  // If there are properties (i.e. an object schema), apply simplification recursively.
  if (schema.properties && typeof schema.properties === "object") {
    const newProperties: any = {};
    for (const key in schema.properties) {
      newProperties[key] = simplifySchema(schema.properties[key]);
    }
    return { ...schema, properties: newProperties };
  }

  // If the schema is an array, simplify its items.
  if (schema.type === "array" && schema.items) {
    return { ...schema, items: simplifySchema(schema.items) };
  }

  return schema;
}

export const TypeVector = (annotations: Record<string, unknown> = {}) =>
  Type.Union(
    [
      Type.Array(Type.Number()),
      Type.Unsafe<Float64Array>({ type: "Float64Array" }),
      Type.Unsafe<Float32Array>({ type: "Float32Array" }),
      Type.Unsafe<Int32Array>({ type: "Int32Array" }),
      Type.Unsafe<Int16Array>({ type: "Int16Array" }),
      Type.Unsafe<Int8Array>({ type: "Int8Array" }),
      Type.Unsafe<Uint8Array>({ type: "Uint8Array" }),
      Type.Unsafe<Uint16Array>({ type: "Uint16Array" }),
      Type.Unsafe<Uint32Array>({ type: "Uint32Array" }),
      Type.Unsafe<Uint8ClampedArray>({ type: "Uint8ClampedArray" }),
      Type.Unsafe<BigInt64Array>({ type: "BigInt64Array" }),
      Type.Unsafe<BigUint64Array>({ type: "BigUint64Array" }),
    ],
    {
      ...annotations,
      $id: "TypeVector",
    }
  );
export type TypeVector = Static<ReturnType<typeof TypeVector>>;
TypeRegistry.Set("TypeVector", (schema: TSchema, value: unknown) => {
  return (
    typeof value === "object" &&
    value !== null &&
    "normalized" in value &&
    "numbers" in value &&
    schema.$id === "TypeVector"
  );
});

export const TypeModel = (annotations: Record<"task" | string, unknown> = {}) =>
  Type.String({
    title: "Model",
    description: `The model ${annotations.task ? `for ${annotations.task} ` : "to use"}`,
    ...annotations,
    $id: "TypeModel",
  });

setTimeout(() => {
  TypeRegistry.Set("TypeModel", (schema: TSchema, modelName: unknown) => {
    if (schema.$id === "TypeModel" && typeof modelName === "string") {
      const repository = getGlobalModelRepository();
      const model = repository.models.get(modelName);
      if (!model) return false;
      if (schema.task) {
        const taskModels = repository.taskModels.get(schema.task);
        if (!taskModels) return false;
      }
      return true;
    }
    return false;
  });
}, 0);

export const TypeOptionalArray = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Array(type)], {
    title: type.title,
    description: type.description,
  });

export const TypeReplicate = <T extends TSchema>(
  type: T,
  annotations: Record<string, unknown> = {}
) =>
  Type.Union([type, Type.Array(type)], {
    title: type.title,
    description: type.description,
    ...annotations,
    replicate: true,
  });
