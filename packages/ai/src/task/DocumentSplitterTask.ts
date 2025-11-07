//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
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
  type JSONSchema7ObjectDefinition,
} from "@podley/task-graph";
import { Document, DocumentFragment } from "../source/Document";
import { TObject, Type } from "@sinclair/typebox";
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
  public static category = "Document";
  public static title = "Document Splitter";
  public static description = "Splits documents into text chunks for processing";
  public static inputSchema(): JSONSchema7ObjectDefinition {
    return Type.Object({
      parser: Type.Union([Type.Literal("txt"), Type.Literal("md")], {
        name: "Document Kind",
        description: "The kind of document (txt or md)",
      }),
      // file: Type.Instance(Document),
    }) as JSONSchema7ObjectDefinition;
  }
  public static outputSchema(): JSONSchema7ObjectDefinition {
    return Type.Object({
      texts: Type.Array(Type.String(), {
        name: "Text Chunks",
        description: "The text chunks of the document",
      }),
    }) as JSONSchema7ObjectDefinition;
  }

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

declare module "@podley/task-graph" {
  interface Workflow {
    DocumentSplitter: CreateWorkflow<
      DocumentSplitterTaskInput,
      DocumentSplitterTaskOutput,
      JobQueueTaskConfig
    >;
  }
}

Workflow.prototype.DocumentSplitter = CreateWorkflow(DocumentSplitterTask);
