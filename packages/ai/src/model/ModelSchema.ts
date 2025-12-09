/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPortSchemaObject, FromSchema } from "@workglow/util";

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
