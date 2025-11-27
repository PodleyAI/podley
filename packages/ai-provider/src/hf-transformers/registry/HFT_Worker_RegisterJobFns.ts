/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createServiceToken,
  globalServiceRegistry,
  parentPort,
  WORKER_SERVER,
} from "@workglow/util";
import {
  HFT_Download,
  HFT_TextEmbedding,
  HFT_TextGeneration,
  HFT_TextQuestionAnswer,
  HFT_TextRewriter,
  HFT_TextSummary,
  HFT_TextTranslation,
} from "../common/HFT_JobRunFns";

export const HFT_WORKER_JOBRUN = createServiceToken("worker.ai-provider.hft");

export const HFT_WORKER_JOBRUN_REGISTER = globalServiceRegistry.register(
  HFT_WORKER_JOBRUN,
  () => {
    const workerServer = globalServiceRegistry.get(WORKER_SERVER);
    workerServer.registerFunction("DownloadModelTask", HFT_Download);
    workerServer.registerFunction("TextEmbeddingTask", HFT_TextEmbedding);
    workerServer.registerFunction("TextGenerationTask", HFT_TextGeneration);
    workerServer.registerFunction("TextTranslationTask", HFT_TextTranslation);
    workerServer.registerFunction("TextRewriterTask", HFT_TextRewriter);
    workerServer.registerFunction("TextSummaryTask", HFT_TextSummary);
    workerServer.registerFunction("TextQuestionAnswerTask", HFT_TextQuestionAnswer);
    parentPort.postMessage({ type: "ready" });
    console.log("HFT_WORKER_JOBRUN registered");
    return workerServer;
  },
  true
);
