/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiProviderRegistry } from "@workglow/ai";
import { globalServiceRegistry, WORKER_MANAGER } from "@workglow/util";
import { HF_TRANSFORMERS_ONNX } from "../common/HFT_Constants";

export async function register_HFT_ClientJobFns(worker: Worker) {
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);

  workerManager.registerWorker(HF_TRANSFORMERS_ONNX, worker);

  const ProviderRegistry = getAiProviderRegistry();
  const names = [
    "DownloadModelTask",
    "TextEmbeddingTask",
    "TextGenerationTask",
    "TextTranslationTask",
    "TextRewriterTask",
    "TextSummaryTask",
    "TextQuestionAnswerTask",
  ];
  for (const name of names) {
    ProviderRegistry.registerAsWorkerRunFn(HF_TRANSFORMERS_ONNX, name);
  }
}
