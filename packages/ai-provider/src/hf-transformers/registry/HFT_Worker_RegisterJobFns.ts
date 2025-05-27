//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, globalServiceRegistry, WORKER_SERVER, parentPort } from "@podley/util";
import {
  HFT_Download,
  HFT_TextEmbedding,
  HFT_TextGeneration,
  HFT_TextTranslation,
  HFT_TextRewriter,
  HFT_TextSummary,
  HFT_TextQuestionAnswer,
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
