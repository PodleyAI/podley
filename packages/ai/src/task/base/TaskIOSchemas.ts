//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Static, TSchema, Type, TypeRegistry } from "@sinclair/typebox";
import { getGlobalModelRepository } from "../../model/ModelRegistry";

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
  return typeof value === "object" && value !== null && schema.$id === "TypeVector";
});

export const TypeModel = (annotations: Record<"task" | string, unknown> = {}) =>
  Type.String({
    title: "Model",
    description: `The model ${annotations.task ? `for ${annotations.task} ` : "to use"}`,
    ...annotations,
    $id: "TypeModel",
  });

export const TypeLanguage = (annotations: Record<string, unknown> = {}) =>
  Type.String({
    title: "Language",
    description: "The language to use",
    maxLength: 2,
    minLength: 2,
    ...annotations,
    $id: "TypeLanguage",
  });

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
