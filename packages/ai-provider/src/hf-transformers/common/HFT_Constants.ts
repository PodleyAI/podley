//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

export const HF_TRANSFORMERS_ONNX = "HF_TRANSFORMERS_ONNX";

export enum QUANTIZATION_DATA_TYPES {
  auto = "auto", // Auto-detect based on environment
  fp32 = "fp32",
  fp16 = "fp16",
  q8 = "q8",
  int8 = "int8",
  uint8 = "uint8",
  q4 = "q4",
  bnb4 = "bnb4",
  q4f16 = "q4f16", // fp16 model with int4 block weight quantization
}
