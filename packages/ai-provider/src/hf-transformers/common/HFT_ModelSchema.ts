/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelRecord as ModelRecordSchema } from "@workglow/ai";
import { DataPortSchemaObject, FromSchema } from "@workglow/util";
import { HF_TRANSFORMERS_ONNX, PipelineUseCase, QuantizationDataType } from "./HFT_Constants";

export const HfTransformersOnnxModelSchema = {
  type: "object",
  properties: {
    provider: {
      const: HF_TRANSFORMERS_ONNX,
      description: "Discriminator: ONNX runtime backend.",
    },
    providerConfig: {
      type: "object",
      description: "ONNX runtime-specific options.",
      properties: {
        pipeline: {
          type: "string",
          enum: Object.values(PipelineUseCase),
          description: "Pipeline type for the ONNX model.",
          default: "text-generation",
        },
        modelPath: {
          type: "string",
          description: "Filesystem path or URI for the ONNX model.",
        },
        dType: {
          type: "string",
          enum: Object.values(QuantizationDataType),
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
        nativeDimensions: {
          type: "integer",
          description: "The native dimensions of the model.",
        },
        normalize: {
          type: "boolean",
          description: "Whether the model uses normalization.",
        },
        languageStyle: {
          type: "string",
          description: "The language style of the model.",
        },
      },
      required: ["modelPath", "pipeline"],
      additionalProperties: false,
      if: {
        properties: {
          pipeline: {
            const: "feature-extraction",
          },
        },
      },
      then: {
        required: ["nativeDimensions"],
      },
    },
  },
  required: ["provider", "providerConfig"],
  additionalProperties: true,
} as const satisfies DataPortSchemaObject;

const ExtendedModelSchema = {
  type: "object",
  properties: {
    ...ModelRecordSchema.properties,
    ...HfTransformersOnnxModelSchema.properties,
  },
  required: [...ModelRecordSchema.required, ...HfTransformersOnnxModelSchema.required],
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

export type HfTransformersOnnxModelRecord = FromSchema<typeof ExtendedModelSchema>;
