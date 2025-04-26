//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  Dataflow,
  IExecuteConfig,
  Task,
  TaskFailedError,
  TaskGraph,
  TaskInputDefinition,
  Workflow,
} from "@ellmers/task-graph";
import { FetchTaskOutput } from "@ellmers/tasks";
import { SecCachedFetchTask, SecCachedFetchTaskInput } from "../../fetch/SecCachedFetchTask";
import { Submission } from "../../types/edgar/company-submissions";
import { Filings } from "../../types/FilingMetaData";

// NOTE: company submissions are mutable, so we need to pass in a date to break the cache

export interface FetchSubmissionsInput extends SecCachedFetchTaskInput {
  file: string;
  date?: string;
}

export type FetchSubmissionsOutput = {
  submission: Omit<Submission, "filings" | "files">;
  filings: Filings;
  files: { name: string; filingCount: number; filingFrom: string; filingTo: string }[];
};

class SecFetchSubmissionsTask extends SecCachedFetchTask<FetchSubmissionsInput> {
  static readonly type = "SecFetchSubmissionsTask";
  static readonly category = "SEC";
  static readonly immutable = false;

  public static inputs: TaskInputDefinition[] = [
    {
      id: "cik",
      name: "CIK",
      valueType: "number",
    },
    {
      id: "file",
      name: "File",
      valueType: "string",
      optional: true,
    },
    {
      id: "date",
      name: "Date",
      valueType: "string",
      optional: true,
    },
  ] as const;

  inputToFileName(input: FetchSubmissionsInput): string {
    const cik = input.cik.toString().padStart(10, "0");
    const fileName = input.file || `CIK${cik}.json`;
    return `submissions/${fileName}`;
  }
  inputToUrl(input: FetchSubmissionsInput): string {
    const cik = input.cik.toString().padStart(10, "0");
    const fileName = input.file || `CIK${cik}.json`;
    return `https://data.sec.gov/submissions/${fileName}${input.date ? `?date=${input.date}` : ""}`;
  }
}

export class FetchSubmissionsTask extends Task<FetchSubmissionsInput, FetchSubmissionsOutput> {
  static readonly type = "FetchSubmissions";
  static readonly category = "SEC";
  static readonly cacheable = true;

  static readonly inputs = [
    {
      id: "cik",
      name: "CIK",
      valueType: "number",
    },
    {
      id: "date",
      name: "Date",
      valueType: "string",
      optional: true,
    },
  ];

  static readonly outputs = [
    {
      id: "submission",
      name: "Submission",
      valueType: "any",
    },
    {
      id: "filings",
      name: "Filings",
      valueType: "any",
    },
    {
      id: "files",
      name: "Files",
      valueType: "any",
      isArray: true,
    },
  ];

  async execute(
    input: FetchSubmissionsInput,
    config: IExecuteConfig
  ): Promise<FetchSubmissionsOutput> {
    const cik = input.cik;
    if (!cik) throw new TaskFailedError("CIK is required");
    const date = input.date;

    const builder = config.own(new Workflow());
    builder.pipe(
      new SecFetchSubmissionsTask(input, {
        id: "fetch-company-submissions",
      }),
      async (input) => {
        const edgarJson = input.json as unknown as Submission;

        const { filings, ...submission } = edgarJson;

        const { recent, files } = filings;
        return { submission, filings: recent, files };
      },
      async (input, config) => {
        const graph = config.own(new TaskGraph());
        graph.addTask(
          async () => {
            return input;
          },
          {
            id: "pass-through",
          }
        );
        for (const file of input.files || []) {
          const fileName = file.name;
          graph.addTask(
            new SecFetchSubmissionsTask(
              {
                cik: cik,
                date: date,
                file: fileName,
              },
              { id: `fetch-${fileName}` }
            )
          );
          graph.addTask(
            async (input: FetchTaskOutput, config: IExecuteConfig) => {
              // example submissions/CIK0000001750-submissions-001.json
              const filings = input.json as unknown as Filings;
              return {
                filings: filings,
              };
            },
            { id: `parse-${fileName}` }
          );
          graph.addDataflow(new Dataflow(`fetch-${fileName}`, "json", `parse-${fileName}`, "json"));
        }

        const result = await graph.run();
        return graph.mergeExecuteOutputsToRunOutput(result, "last-or-property-array");
      }
    );
    const output = await builder.run();
    return output as FetchSubmissionsOutput;
  }
}
