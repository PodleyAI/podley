/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CreateWorkflow,
  JobQueueTaskConfig,
  Task,
  TaskRegistry,
  Workflow,
} from "@podley/task-graph";
import { DataPortSchema, FromSchema } from "@podley/util";
import { Document, DocumentFragment } from "../source/Document";

const inputSchema = {
  type: "object",
  properties: {
    parser: {
      type: "string",
      enum: ["txt", "md"],
      title: "Document Kind",
      description: "The kind of document (txt or md)",
    },
    // file: Type.Instance(Document),
  },
  required: ["parser"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

const outputSchema = {
  type: "object",
  properties: {
    texts: {
      type: "array",
      items: { type: "string" },
      title: "Text Chunks",
      description: "The text chunks of the document",
    },
  },
  required: ["texts"],
  additionalProperties: false,
} as const satisfies DataPortSchema;

export type DocumentSplitterTaskInput = FromSchema<typeof inputSchema>;
export type DocumentSplitterTaskOutput = FromSchema<typeof outputSchema>;

export class DocumentSplitterTask extends Task<
  DocumentSplitterTaskInput,
  DocumentSplitterTaskOutput,
  JobQueueTaskConfig
> {
  public static type = "DocumentSplitterTask";
  public static category = "Document";
  public static title = "Document Splitter";
  public static description = "Splits documents into text chunks for processing";
  public static inputSchema(): DataPortSchema {
    return inputSchema as DataPortSchema;
  }
  public static outputSchema(): DataPortSchema {
    return outputSchema as DataPortSchema;
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
