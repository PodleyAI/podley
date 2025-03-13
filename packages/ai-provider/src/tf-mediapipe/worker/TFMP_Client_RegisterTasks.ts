//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  getAiProviderRegistry,
  TextEmbeddingTaskInput,
  TextEmbeddingTaskOutput,
} from "@ellmers/ai";
import { DownloadModelTask, TextEmbeddingTask } from "@ellmers/ai";
import { TFMP_Client_Download, TFMP_Client_TextEmbedding } from "./TFMP_Client_TaskRun";
import { MEDIA_PIPE_TFJS_MODEL } from "../common/TFMP_Constants";

export const registerMediaPipeTfJsLocalTasks = () => {
  const aiProviderRegistry = getAiProviderRegistry();

  aiProviderRegistry.registerRunFn(
    DownloadModelTask.type,
    MEDIA_PIPE_TFJS_MODEL,
    TFMP_Client_Download
  );

  aiProviderRegistry.registerRunFn<TextEmbeddingTaskInput, TextEmbeddingTaskOutput>(
    TextEmbeddingTask.type,
    MEDIA_PIPE_TFJS_MODEL,
    TFMP_Client_TextEmbedding
  );
};
