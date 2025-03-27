//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { CreateWorkflow, JobQueueTaskConfig, TaskRegistry, Workflow } from "@ellmers/task-graph";
import { AiTask } from "./base/AiTask";
import { Type, type Static } from "@sinclair/typebox";
import { TypeModel } from "./base/TaskIOSchemas";

const TextTranslationInputSchema = Type.Object({
  text: Type.String({
    title: "Text",
    description: "The text to translate",
  }),
  source_lang: Type.String({
    title: "Source Language",
    description: "The source language",
    maxLength: 2,
    minLength: 2,
  }),
  target_lang: Type.String({
    title: "Target Language",
    description: "The target language",
    maxLength: 2,
    minLength: 2,
  }),
  model: TypeModel({
    task: "TextTranslationTask",
    title: "Model",
    description: "The model to use for text translation",
  }),
});

const TextTranslationOutputSchema = Type.Object({
  text: Type.String({
    title: "Text",
    description: "The translated text",
  }),
  target_lang: Type.String({
    title: "Output Language",
    description: "The output language",
  }),
});

export type TextTranslationTaskInput = Static<typeof TextTranslationInputSchema>;
export type TextTranslationTaskOutput = Static<typeof TextTranslationOutputSchema>;

/**
 * This translates text from one language to another
 */
export class TextTranslationTask extends AiTask<
  TextTranslationTaskInput,
  TextTranslationTaskOutput
> {
  public static type = "TextTranslationTask";
  public static category = "Text Model";
  public static inputSchema = TextTranslationInputSchema;
  public static outputSchema = TextTranslationOutputSchema;
}

TaskRegistry.registerTask(TextTranslationTask);

/**
 * Convenience function to run text translation tasks.
 * Creates and executes a TextTranslationCompoundTask with the provided input.
 * @param input The input parameters for text translation (text, model, source_lang, and target_lang)
 * @returns Promise resolving to the translated text output(s)
 */
export const TextTranslation = (input: TextTranslationTaskInput, config?: JobQueueTaskConfig) => {
  return new TextTranslationTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextTranslation: CreateWorkflow<
      TextTranslationTaskInput,
      TextTranslationTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextTranslation = CreateWorkflow(TextTranslationTask);
