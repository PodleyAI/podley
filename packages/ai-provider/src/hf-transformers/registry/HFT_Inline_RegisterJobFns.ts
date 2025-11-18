/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiProviderRegistry } from "@podley/ai";
import { env } from "@sroussey/transformers";

import { HF_TRANSFORMERS_ONNX } from "../common/HFT_Constants";
import {
  HFT_Download,
  HFT_TextEmbedding,
  HFT_TextGeneration,
  HFT_TextQuestionAnswer,
  HFT_TextRewriter,
  HFT_TextSummary,
  HFT_TextTranslation,
} from "../common/HFT_JobRunFns";

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
