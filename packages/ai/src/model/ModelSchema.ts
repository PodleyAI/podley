/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPortSchemaObject, FromSchema } from "@workglow/util";

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const ModelSchema = {
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
  required: ["model_id", "tasks", "provider", "title", "description", "providerConfig", "metadata"],
  format: "model",
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

export type ModelRecord = FromSchema<typeof ModelSchema>;
export const ModelPrimaryKeyNames = ["model_id"] as const;

/**
 * Minimal model configuration needed to run tasks.
 *
 * @remarks
 * {@link ModelRecord} represents the persisted shape (for storage in a {@link ModelRepository}).
 * For runtime execution, only {@link ModelRecord.provider} and {@link ModelRecord.providerConfig}
 * are strictly required; other fields are optional and may be synthesized.
 */
export type ModelConfig = Optional<
  ModelRecord,
  "model_id" | "tasks" | "title" | "description" | "metadata"
>;

/**
 * JSON schema for {@link ModelConfig}.
 *
 * @remarks
 * This is intentionally less strict than {@link ModelSchema} (storage schema).
 * It allows inline model configs for task execution without requiring repository-only fields.
 */
export const ModelConfigSchema = {
  ...ModelSchema,
  required: ["provider", "providerConfig"],
} as const satisfies DataPortSchemaObject;
