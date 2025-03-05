//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskInputDefinition,
  TaskInvalidInputError,
  TaskOutputDefinition,
  TaskRegistry,
  Workflow,
} from "@ellmers/task-graph";
import { ConvertAllToOptionalArray } from "@ellmers/util";
import { AiTask } from "./base/AiTask";
import { language, model_translation } from "./base/TaskIOTypes";

export type TextTranslationTaskInput = {
  text: string;
  model: model_translation;
  source_lang: language;
  target_lang: language;
};
export type TextTranslationTaskOutput = {
  text: string;
  target_lang: language;
};
type TextTranslationTaskInputReplicate = ConvertAllToOptionalArray<TextTranslationTaskInput>;
type TextTranslationTaskOutputReplicate = ConvertAllToOptionalArray<TextTranslationTaskOutput>;

/**
 * This generates text from a prompt
 */
export class TextTranslationTask extends AiTask<
  TextTranslationTaskInputReplicate,
  TextTranslationTaskOutputReplicate
> {
  public static type = "TextTranslationTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "text",
      name: "Text",
      valueType: "text",
      isArray: "replicate",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_translation",
      isArray: "replicate",
    },
    {
      id: "source_lang",
      name: "Input Language",
      valueType: "language",
      isArray: "replicate",
    },
    {
      id: "target_lang",
      name: "Output Language",
      valueType: "language",
      isArray: "replicate",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Text", valueType: "text" },
    {
      id: "target_lang",
      name: "Output Language",
      valueType: "language",
      isArray: "replicate",
    },
  ] as const;

  async validateItem(valueType: string, item: any) {
    if (valueType == "language") {
      const valid = typeof item == "string" && item.length == 2;
      if (!valid) {
        throw new TaskInvalidInputError(`language must be a 2 character string: ${item}`);
      }
      return valid;
    }
    return super.validateItem(valueType, item);
  }
}
TaskRegistry.registerTask(TextTranslationTask);

/**
 * Convenience function to run text translation tasks.
 * Creates and executes a TextTranslationCompoundTask with the provided input.
 * @param input The input parameters for text translation (text, model, source_lang, and target_lang)
 * @returns Promise resolving to the translated text output(s)
 */
export const TextTranslation = (
  input: TextTranslationTaskInputReplicate,
  config?: JobQueueTaskConfig
) => {
  return new TextTranslationTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextTranslation: CreateWorkflow<
      TextTranslationTaskInputReplicate,
      TextTranslationTaskOutputReplicate,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextTranslation = CreateWorkflow(TextTranslationTask);
