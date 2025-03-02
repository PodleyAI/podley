//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  SingleTask,
  Workflow,
  CreateWorkflow,
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskRegistry,
  JobQueueTaskConfig,
} from "@ellmers/task-graph";
import { Document, DocumentFragment } from "../source/Document";

export type DocumentSplitterTaskInput = {
  parser: "txt" | "md";
  file: Document;
};
export type DocumentSplitterTaskOutput = {
  texts: string[];
};

export class DocumentSplitterTask extends SingleTask<
  DocumentSplitterTaskInput,
  DocumentSplitterTaskOutput,
  JobQueueTaskConfig
> {
  public static type = "DocumentSplitterTask";
  public static category = "Input";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "parser",
      name: "Kind",
      valueType: "doc_parser",
      defaultValue: "txt",
    },
    {
      id: "file",
      name: "File",
      valueType: "document",
    },
    // {
    //   id: "variant",
    //   name: "Variant",
    //   valueType: "doc_variant",
    //   defaultValue: "tree",
    // },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    {
      id: "texts",
      name: "Texts",
      valueType: "text",
      isArray: true,
    },
  ] as const;

  flattenFragmentsToTexts(item: DocumentFragment | Document): string[] {
    if (item instanceof Document) {
      const texts: string[] = [];
      item.fragments.forEach((fragment) => {
        texts.push(...this.flattenFragmentsToTexts(fragment));
      });
      return texts;
    } else {
      return [item.content];
    }
  }

  async runReactive(): Promise<DocumentSplitterTaskOutput> {
    return { texts: this.flattenFragmentsToTexts(this.runInputData.file) };
  }
}
TaskRegistry.registerTask(DocumentSplitterTask);

export const DocumentSplitter = (input: DocumentSplitterTaskInput) => {
  return new DocumentSplitterTask(input).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    DocumentSplitter: CreateWorkflow<
      DocumentSplitterTaskInput,
      DocumentSplitterTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.DocumentSplitter = CreateWorkflow(DocumentSplitterTask);
