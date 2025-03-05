//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  arrayTaskFactory,
  CreateWorkflow,
  JobQueueTaskConfig,
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskRegistry,
  Workflow,
} from "@ellmers/task-graph";
import { AiTask } from "./base/AiTask";
import { model_generation } from "./base/TaskIOTypes";
import { ConvertAllToOptionalArray } from "@ellmers/util";

export type TextGenerationTaskInput = {
  prompt: string;
  model: model_generation;
};
export type TextGenerationTaskOutput = {
  text: string;
};
type TextGenerationTaskInputReplicate = ConvertAllToOptionalArray<TextGenerationTaskInput>;
type TextGenerationTaskOutputReplicate = ConvertAllToOptionalArray<TextGenerationTaskOutput>;

/**
 * This generates text from a prompt
 */
export class TextGenerationTask extends AiTask<
  TextGenerationTaskInputReplicate,
  TextGenerationTaskOutputReplicate
> {
  public static type = "TextGenerationTask";
  public static category = "Text Model";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "prompt",
      name: "Prompt",
      valueType: "text",
      isArray: "replicate",
    },
    {
      id: "model",
      name: "Model",
      valueType: "model_generation",
      isArray: "replicate",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "text", name: "Text", valueType: "text", isArray: "replicate" },
  ] as const;
}
TaskRegistry.registerTask(TextGenerationTask);

/**
 * Convenience function to run text generation tasks.
 * Creates and executes a TextGenerationCompoundTask with the provided input.
 * @param input The input parameters for text generation (prompts and models)
 * @returns Promise resolving to the generated text output(s)
 */
export const TextGeneration = (
  input: TextGenerationTaskInputReplicate,
  config?: JobQueueTaskConfig
) => {
  return new TextGenerationTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    TextGeneration: CreateWorkflow<
      TextGenerationTaskInputReplicate,
      TextGenerationTaskOutputReplicate,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.TextGeneration = CreateWorkflow(TextGenerationTask);
