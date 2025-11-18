/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiProviderRegistry } from "@podley/ai";
import { globalServiceRegistry, WORKER_MANAGER } from "@podley/util";
import { TENSORFLOW_MEDIAPIPE } from "../common/TFMP_Constants";

export const register_TFMP_ClientJobFns = (worker: Worker) => {
  const workerManager = globalServiceRegistry.get(WORKER_MANAGER);
  workerManager.registerWorker(TENSORFLOW_MEDIAPIPE, worker);

  const aiProviderRegistry = getAiProviderRegistry();
  const names = ["DownloadModelTask", "TextEmbeddingTask"];
  for (const name of names) {
    aiProviderRegistry.registerAsWorkerRunFn(TENSORFLOW_MEDIAPIPE, name);
  }
};
