/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelSchema } from "@workglow/ai";
import { DataPortSchemaObject, FromSchema } from "@workglow/util";
import { TENSORFLOW_MEDIAPIPE } from "../common/TFMP_Constants";

export const TFMPModelSchema = {
  type: "object",
  properties: {
    provider: {
      const: TENSORFLOW_MEDIAPIPE,
      description: "Discriminator: TensorFlow MediaPipe backend.",
    },
    providerConfig: {
      type: "object",
      description: "TensorFlow MediaPipe-specific options.",
      properties: {
        modelPath: {
          type: "string",
          description: "Filesystem path or URI for the ONNX model.",
        },
      },
      required: ["modelPath"],
      additionalProperties: false,
    },
  },
  required: ["provider", "providerConfig"],
  additionalProperties: true,
} as const satisfies DataPortSchemaObject;

const ExtendedModelSchema = {
  type: "object",
  properties: {
    ...ModelSchema.properties,
    ...TFMPModelSchema.properties,
  },
  required: [...ModelSchema.required, ...TFMPModelSchema.required],
  additionalProperties: false,
} as const satisfies DataPortSchemaObject;

export type TFMPModelRecord = FromSchema<typeof ExtendedModelSchema>;
