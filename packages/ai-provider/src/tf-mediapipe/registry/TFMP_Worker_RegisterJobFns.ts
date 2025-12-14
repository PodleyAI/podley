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
  TFMP_Download,
  TFMP_TextClassifier,
  TFMP_TextEmbedding,
  TFMP_TextLanguageDetection,
  TFMP_Unload,
} from "../common/TFMP_JobRunFns";

// Register the worker functions
export const TFMP_WORKER_JOBRUN = createServiceToken("worker.ai-provider.tfmp");

export const TFMP_WORKER_JOBRUN_REGISTER = globalServiceRegistry.register(
  TFMP_WORKER_JOBRUN,
  () => {
    const workerServer = globalServiceRegistry.get(WORKER_SERVER);
    workerServer.registerFunction("DownloadModelTask", TFMP_Download);
    workerServer.registerFunction("UnloadModelTask", TFMP_Unload);
    workerServer.registerFunction("TextEmbeddingTask", TFMP_TextEmbedding);
    workerServer.registerFunction("TextLanguageDetectionTask", TFMP_TextLanguageDetection);
    workerServer.registerFunction("TextClassifierTask", TFMP_TextClassifier);
    parentPort.postMessage({ type: "ready" });
    console.log("TFMP_WORKER_JOBRUN registered");
    return workerServer;
  },
  true
);
