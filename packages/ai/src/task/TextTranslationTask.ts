//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  ConvertSomeToArray,
  ConvertSomeToOptionalArray,
  TaskInputDefinition,
  TaskInvalidInputError,
  TaskOutputDefinition,
  arrayTaskFactory,
} from "@ellmers/task-graph";
import { TaskRegistry } from "@ellmers/task-graph";
import { JobQueueTaskConfig } from "@ellmers/task-graph";
import { Workflow, CreateWorkflow } from "@ellmers/task-graph";
import { AiTask } from "./base/AiTask";
import { language } from "./base/TaskIOTypes";
import { model_translation } from "./base/TaskIOTypes";

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

/**
 * This generates text from a prompt
 */
export class TextTranslationTask extends AiTask {
  public static type = "TextTranslationTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "text",
      name: "Text",
      valueType: "text",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_translation",
    },
    {
      id: "source_lang",
      name: "Input Language",
      valueType: "language",
    },
    {
      id: "target_lang",
      name: "Output Language",
      valueType: "language",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Text", valueType: "text" },
    {
      id: "target_lang",
      name: "Output Language",
      valueType: "language",
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

type TextTranslationCompoundOutput = ConvertSomeToArray<TextTranslationTaskOutput, "text">;

type TextTranslationCompoundTaskInput = ConvertSomeToOptionalArray<
  TextTranslationTaskInput,
  "model" | "text"
>;
export const TextTranslationCompoundTask = arrayTaskFactory<
  TextTranslationCompoundTaskInput,
  TextTranslationCompoundOutput,
  TextTranslationTaskInput,
  TextTranslationTaskOutput,
  JobQueueTaskConfig
>(TextTranslationTask as any, ["model", "text"]);

export const TextTranslation = (input: TextTranslationCompoundTaskInput) => {
  if (Array.isArray(input.model) || Array.isArray(input.text)) {
    return new TextTranslationCompoundTask(input).run();
  } else {
    return new TextTranslationTask(input as TextTranslationTaskInput).run();
  }
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextTranslation: CreateWorkflow<
      TextTranslationCompoundTaskInput,
      TextTranslationCompoundOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextTranslation = CreateWorkflow(TextTranslationCompoundTask);
