//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************
import { globalServiceRegistry, WORKER_MANAGER } from "@ellmers/util";
import { getAiProviderRegistry } from "@ellmers/ai";
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
