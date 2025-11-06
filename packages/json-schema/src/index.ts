//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/**
 * This package exports all JSON Schema definitions and TypeScript types
 * for Podley task input and output schemas.
 *
 * Each schema is exported in two forms:
 * 1. As a TypeBox schema object (e.g., TextGenerationInputSchema)
 * 2. As a TypeScript type (e.g., TextGenerationTaskInput)
 *
 * The TypeBox schemas can be converted to JSON Schema format using JSON.stringify()
 */

// Re-export all task schemas from @podley/ai
export {
  // Text Generation Task
  TextGenerationInputSchema,
  TextGenerationOutputSchema,
  type TextGenerationTaskInput,
  type TextGenerationTaskOutput,

  // Text Rewriter Task
  TextRewriterInputSchema,
  TextRewriterOutputSchema,
  type TextRewriterTaskInput,
  type TextRewriterTaskOutput,

  // Text Embedding Task
  TextEmbeddingInputSchema,
  TextEmbeddingOutputSchema,
  type TextEmbeddingTaskInput,
  type TextEmbeddingTaskOutput,

  // Text Summary Task
  TextSummaryInputSchema,
  TextSummaryOutputSchema,
  type TextSummaryTaskInput,
  type TextSummaryTaskOutput,

  // Text Question Answer Task
  TextQuestionAnswerInputSchema,
  TextQuestionAnswerOutputSchema,
  type TextQuestionAnswerTaskInput,
  type TextQuestionAnswerTaskOutput,

  // Text Translation Task
  TextTranslationInputSchema,
  TextTranslationOutputSchema,
  type TextTranslationTaskInput,
  type TextTranslationTaskOutput,

  // Download Model Task
  DownloadModelInputSchema,
  DownloadModelOutputSchema,
  type DownloadModelTaskRunInput,
  type DownloadModelTaskRunOutput,

  // Vector Similarity Task
  VectorSimilarityInputSchema,
  VectorSimilarityOutputSchema,
  type VectorSimilarityTaskInput,
  type VectorSimilarityTaskOutput,
} from "@podley/ai";
