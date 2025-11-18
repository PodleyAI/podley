/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, globalServiceRegistry, parentPort, WORKER_SERVER } from "@podley/util";
import { TFMP_Download, TFMP_TextEmbedding } from "../common/TFMP_JobRunFns";

// Register the worker functions
export const TFMP_WORKER_JOBRUN = createServiceToken("worker.ai-provider.tfmp");

export const TFMP_WORKER_JOBRUN_REGISTER = globalServiceRegistry.register(
  TFMP_WORKER_JOBRUN,
  () => {
    const workerServer = globalServiceRegistry.get(WORKER_SERVER);
    workerServer.registerFunction("DownloadModelTask", TFMP_Download);
    workerServer.registerFunction("TextEmbeddingTask", TFMP_TextEmbedding);
    parentPort.postMessage({ type: "ready" });
    console.log("TFMP_WORKER_JOBRUN registered");
    return workerServer;
  },
  true
);
