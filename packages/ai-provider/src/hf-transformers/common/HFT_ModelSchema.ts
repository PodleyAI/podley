/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelSchema } from "@workglow/ai";
import { DataPortSchemaObject, FromSchema } from "@workglow/util";

export const HfTransformersOnnxModelSchema = {
  type: "object",
  properties: {
    provider: {
      const: "onnx",
      description: "Discriminator: ONNX runtime backend.",
    },
    providerConfig: {
      type: "object",
      description: "ONNX runtime-specific options.",
      properties: {
        modelPath: {
          type: "string",
          description: "Filesystem path or URI for the ONNX model.",
        },
        dType: {
          type: "string",
          enum: ["float32", "float16", "int8", "base64"],
          description: "Data type for the ONNX model.",
          default: "float32",
        },
        device: {
          type: "string",
          enum: ["cpu", "gpu", "webgpu", "wasm", "metal"],
          description: "High-level device selection.",
          default: "webgpu",
        },
        executionProviders: {
          type: "array",
          items: { type: "string" },
          description: "Raw ONNX Runtime execution provider identifiers.",
        },
        intraOpNumThreads: {
          type: "integer",
          minimum: 1,
        },
        interOpNumThreads: {
          type: "integer",
          minimum: 1,
        },
        useExternalDataFormat: {
          type: "boolean",
          description: "Whether the model uses external data format.",
        },
      },
      required: ["modelPath"],
      additionalProperties: false,
    },
  },
  required: ["provider", "providerConfig"],
  additionalProperties: true,
} as const satisfies DataPortSchemaObject;

export const ExtendedModelSchema = {
  type: "object",
  properties: {
    ...ModelSchema.properties,
    ...HfTransformersOnnxModelSchema.properties,
  },
  required: [...ModelSchema.required, ...HfTransformersOnnxModelSchema.required],
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

export type HfTransformersOnnxModelRecord = FromSchema<typeof ExtendedModelSchema>;
