//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { getAiProviderRegistry } from "@ellmers/ai";
import { TENSORFLOW_MEDIAPIPE } from "../common/TFMP_Constants";
import { globalServiceRegistry, WORKER_MANAGER } from "@ellmers/util";

export const register_TFMP_ClientJobFns = (worker: Worker) => {
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  workerManager.registerWorker(TENSORFLOW_MEDIAPIPE, worker);

  const aiProviderRegistry = getAiProviderRegistry();
  const names = ["DownloadModelTask", "TextEmbeddingTask"];
  for (const name of names) {
    aiProviderRegistry.registerAsWorkerRunFn(TENSORFLOW_MEDIAPIPE, name);
  }
};
