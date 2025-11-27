/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAiProviderRegistry } from "@workglow/ai";
import { TENSORFLOW_MEDIAPIPE } from "../common/TFMP_Constants";
import { TFMP_Download, TFMP_TextEmbedding } from "../common/TFMP_JobRunFns";

export const register_TFMP_InlineJobFns = () => {
  const aiProviderRegistry = getAiProviderRegistry();

  aiProviderRegistry.registerRunFn(TENSORFLOW_MEDIAPIPE, "DownloadModelTask", TFMP_Download);
  aiProviderRegistry.registerRunFn(TENSORFLOW_MEDIAPIPE, "TextEmbeddingTask", TFMP_TextEmbedding);
};
