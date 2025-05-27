//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken, globalServiceRegistry, WORKER_SERVER, parentPort } from "@podley/util";
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
