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
  TFMP_ImageClassification,
  TFMP_ImageEmbedding,
  TFMP_ImageSegmentation,
  TFMP_ObjectDetection,
  TFMP_TextClassification,
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
    workerServer.registerFunction("TextClassificationTask", TFMP_TextClassification);
    workerServer.registerFunction("ImageSegmentationTask", TFMP_ImageSegmentation);
    workerServer.registerFunction("ImageEmbeddingTask", TFMP_ImageEmbedding);
    workerServer.registerFunction("ImageClassificationTask", TFMP_ImageClassification);
    workerServer.registerFunction("ObjectDetectionTask", TFMP_ObjectDetection);
    parentPort.postMessage({ type: "ready" });
    console.log("TFMP_WORKER_JOBRUN registered");
    return workerServer;
  },
  true
);
