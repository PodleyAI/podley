//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  getAiProviderRegistry,
  DownloadModelTask,
  TextEmbeddingTask,
  TextGenerationTask,
  TextQuestionAnswerTask,
  TextRewriterTask,
  TextSummaryTask,
  TextTranslationTask,
} from "@ellmers/ai";
import {
  HFT_Inline_DownloadRun,
  HFT_Inline_EmbeddingRun,
  HFT_Inline_TextGenerationRun,
  HFT_Inline_TextQuestionAnswerRun,
  HFT_Inline_TextRewriterRun,
  HFT_Inline_TextSummaryRun,
  HFT_Inline_TextTranslationRun,
} from "./HFT_Inline_TaskRun";
import { ONNX_TRANSFORMERJS } from "../common/HFT_Constants";

export async function registerHuggingfaceLocalTasks() {
  const ProviderRegistry = getAiProviderRegistry();

  ProviderRegistry.registerRunFn(
    DownloadModelTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Inline_DownloadRun
  );

  ProviderRegistry.registerRunFn(
    TextEmbeddingTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Inline_EmbeddingRun
  );

  ProviderRegistry.registerRunFn(
    TextGenerationTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Inline_TextGenerationRun
  );

  ProviderRegistry.registerRunFn(
    TextTranslationTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Inline_TextTranslationRun
  );

  ProviderRegistry.registerRunFn(
    TextRewriterTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Inline_TextRewriterRun
  );

  ProviderRegistry.registerRunFn(
    TextSummaryTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Inline_TextSummaryRun
  );

  ProviderRegistry.registerRunFn(
    TextQuestionAnswerTask.type,
    ONNX_TRANSFORMERJS,
    HFT_Inline_TextQuestionAnswerRun
  );
}
