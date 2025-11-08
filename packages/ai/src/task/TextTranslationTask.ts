//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskRegistry,
  TypeReplicateArray,
  Workflow,
  type DataPortSchema,
} from "@podley/task-graph";
import { TypeOptionalArray } from "@podley/util";
import { z } from "zod";
import { AiTask } from "./base/AiTask";
import { TypeLanguage, TypeModel } from "./base/AiTaskSchemas";

export const TextTranslationInputSchema = z.object({
  text: TypeReplicateArray(
    z.string().describe("The text to translate")
  ),
  source_lang: TypeReplicateArray(
    TypeLanguage().describe("The source language")
  ),
  target_lang: TypeReplicateArray(
    TypeLanguage().describe("The target language")
  ),
  model: TypeReplicateArray(TypeModel("model:TextTranslationTask")),
});

export const TextTranslationOutputSchema = z.object({
  text: TypeOptionalArray(
    z.string().describe("The translated text")
  ),
  target_lang: TypeLanguage().describe("The output language"),
});

export type TextTranslationTaskInput = z.infer<typeof TextTranslationInputSchema>;
export type TextTranslationTaskOutput = z.infer<typeof TextTranslationOutputSchema>;

/**
 * This translates text from one language to another
 */
export class TextTranslationTask extends AiTask<
  TextTranslationTaskInput,
  TextTranslationTaskOutput
> {
  public static type = "TextTranslationTask";
  public static category = "AI Text Model";
  public static title = "Text Translation";
  public static description = "Translates text from one language to another using language models";
  public static inputSchema(): DataPortSchema {
    return TextTranslationInputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return TextTranslationOutputSchema as DataPortSchema;
  }
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

declare module "@podley/task-graph" {
  interface Workflow {
    TextTranslation: CreateWorkflow<
      TextTranslationTaskInput,
      TextTranslationTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextTranslation = CreateWorkflow(TextTranslationTask);
