//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  Workflow,
  CreateWorkflow,
  TaskRegistry,
  JobQueueTaskConfig,
  Task,
} from "@ellmers/task-graph";
import { Document, DocumentFragment } from "../source/Document";
import { Type } from "@sinclair/typebox";
export type DocumentSplitterTaskInput = {
  parser: "txt" | "md";
  file: Document;
};
export type DocumentSplitterTaskOutput = {
  texts: string[];
};

export class DocumentSplitterTask extends Task<
  DocumentSplitterTaskInput,
  DocumentSplitterTaskOutput,
  JobQueueTaskConfig
> {
  public static type = "DocumentSplitterTask";
  public static category = "Input";
  public static inputSchema = Type.Object({
    parser: Type.Union([Type.Literal("txt"), Type.Literal("md")], {
      name: "Document Kind",
      description: "The kind of document (txt or md)",
    }),
    // file: Type.Instance(Document),
  });
  public static outputSchema = Type.Object({
    texts: Type.Array(Type.String(), {
      name: "Text Chunks",
      description: "The text chunks of the document",
    }),
  });

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

  async executeReactive(): Promise<DocumentSplitterTaskOutput> {
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
