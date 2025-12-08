/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

export const HF_TRANSFORMERS_ONNX = "HF_TRANSFORMERS_ONNX";

export type QuantizationDataType =
  | "auto" // Auto-detect based on environment
  | "fp32"
  | "fp16"
  | "q8"
  | "int8"
  | "uint8"
  | "q4"
  | "bnb4"
  | "q4f16"; // fp16 model with int4 block weight quantization

export const QuantizationDataType = {
  auto: "auto",
  fp32: "fp32",
  fp16: "fp16",
  q8: "q8",
  int8: "int8",
  uint8: "uint8",
  q4: "q4",
  bnb4: "bnb4",
  q4f16: "q4f16",
} as const satisfies Record<QuantizationDataType, QuantizationDataType>;
