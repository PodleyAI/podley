//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { getAiProviderRegistry } from "@ellmers/ai";
import {
  HFT_Download,
  HFT_TextEmbedding,
  HFT_TextGeneration,
  HFT_TextQuestionAnswer,
  HFT_TextRewriter,
  HFT_TextSummary,
  HFT_TextTranslation,
} from "../common/HFT_JobRunFns";
import { HF_TRANSFORMERS_ONNX } from "../common/HFT_Constants";
import { env } from "@huggingface/transformers";

export async function register_HFT_InlineJobFns() {
  // @ts-ignore
  env.backends.onnx.wasm.proxy = true;
  const ProviderRegistry = getAiProviderRegistry();
  const fns = {
    ["DownloadModelTask"]: HFT_Download,
    ["TextEmbeddingTask"]: HFT_TextEmbedding,
    ["TextGenerationTask"]: HFT_TextGeneration,
    ["TextQuestionAnswerTask"]: HFT_TextQuestionAnswer,
    ["TextRewriterTask"]: HFT_TextRewriter,
    ["TextSummaryTask"]: HFT_TextSummary,
    ["TextTranslationTask"]: HFT_TextTranslation,
  };
  for (const [jobName, fn] of Object.entries(fns)) {
    ProviderRegistry.registerRunFn<any, any>(HF_TRANSFORMERS_ONNX, jobName, fn);
  }
}
