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
  Workflow,
  TypeReplicateArray,
} from "@podley/task-graph";
import { AiTask } from "./base/AiTask";
import { TObject, Type, type Static } from "@sinclair/typebox";
import { TypeLanguage, TypeModel } from "./base/AiTaskSchemas";
import { TypeOptionalArray } from "@podley/util";

export const TextTranslationInputSchema = Type.Object({
  text: TypeReplicateArray(
    Type.String({
      title: "Text",
      description: "The text to translate",
    })
  ),
  source_lang: TypeReplicateArray(
    TypeLanguage({
      title: "Source Language",
      description: "The source language",
    })
  ),
  target_lang: TypeReplicateArray(
    TypeLanguage({
      title: "Target Language",
      description: "The target language",
    })
  ),
  model: TypeReplicateArray(TypeModel("model:TextTranslationTask")),
});

export const TextTranslationOutputSchema = Type.Object({
  text: TypeOptionalArray(
    Type.String({
      title: "Text",
      description: "The translated text",
    })
  ),
  target_lang: TypeLanguage({
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
  public static category = "AI Text Model";
  public static title = "Text Translation";
  public static description = "Translates text from one language to another using language models";
  public static inputSchema(): TObject {
    return TextTranslationInputSchema;
  }
  public static outputSchema(): TObject {
    return TextTranslationOutputSchema;
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
