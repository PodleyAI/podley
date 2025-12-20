/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPortSchemaObject, FromSchema } from "@workglow/util";

/**
 * A model configuration suitable for task/job inputs.
 *
 * @remarks
 * This is intentionally less strict than {@link ModelRecord} so jobs can carry only the
 * provider configuration required to execute, without requiring access to a model repository.
 */
export const ModelConfig = {
  type: "object",
  properties: {
    model_id: { type: "string" },
    tasks: { type: "array", items: { type: "string" } },
    title: { type: "string" },
    description: { type: "string" },
    provider: { type: "string" },
    providerConfig: { type: "object", default: {} },
    metadata: { type: "object", default: {} },
  },
  required: ["provider", "providerConfig"],
  format: "model",
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

/**
 * A fully-specified model record suitable for persistence in a repository.
 */
export const ModelRecord = {
  type: "object",
  properties: {
    ...ModelConfig.properties,
  },
  required: ["model_id", "tasks", "provider", "title", "description", "providerConfig", "metadata"],
  format: "model",
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

export type ModelConfig = FromSchema<typeof ModelConfig>;
export type ModelRecord = FromSchema<typeof ModelRecord>;
export const ModelPrimaryKeyNames = ["model_id"] as const;
