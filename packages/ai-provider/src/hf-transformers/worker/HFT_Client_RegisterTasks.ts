//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  DownloadModelTask,
  getAiProviderRegistry,
  TextEmbeddingTask,
  TextGenerationTask,
  TextQuestionAnswerTask,
  TextRewriterTask,
  TextSummaryTask,
  TextTranslationTask,
} from "@ellmers/ai";
import { ONNX_TRANSFORMERJS } from "../common/HFT_Constants";
import {
  HFT_Client_DownloadRun,
  HFT_Client_EmbeddingRun,
  HFT_Client_TextGenerationRun,
  HFT_Client_TextQuestionAnswerRun,
  HFT_Client_TextRewriterRun,
  HFT_Client_TextSummaryRun,
  HFT_Client_TextTranslationRun,
} from "./HFT_Client_TaskRun";

export async function registerHuggingfaceLocalTasks() {
  const ProviderRegistry = getAiProviderRegistry();

  ProviderRegistry.registerRunFn(
    DownloadModelTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Client_DownloadRun
  );

  ProviderRegistry.registerRunFn(
    TextEmbeddingTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Client_EmbeddingRun
  );

  ProviderRegistry.registerRunFn(
    TextGenerationTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Client_TextGenerationRun
  );

  ProviderRegistry.registerRunFn(
    TextTranslationTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Client_TextTranslationRun
  );

  ProviderRegistry.registerRunFn(
    TextRewriterTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Client_TextRewriterRun
  );

  ProviderRegistry.registerRunFn(
    TextSummaryTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Client_TextSummaryRun
  );

  ProviderRegistry.registerRunFn(
    TextQuestionAnswerTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Client_TextQuestionAnswerRun
  );
}
