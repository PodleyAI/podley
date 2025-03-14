//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { getAiProviderRegistry } from "@ellmers/ai";
import { TFMP_Download, TFMP_TextEmbedding } from "../common/TFMP_JobRunFns";
import { TENSORFLOW_MEDIAPIPE } from "../common/TFMP_Constants";

export const register_TFMP_InlineJobFns = () => {
  const aiProviderRegistry = getAiProviderRegistry();

  aiProviderRegistry.registerRunFn(TENSORFLOW_MEDIAPIPE, "DownloadModelTask", TFMP_Download);
  aiProviderRegistry.registerRunFn(TENSORFLOW_MEDIAPIPE, "TextEmbeddingTask", TFMP_TextEmbedding);
};
