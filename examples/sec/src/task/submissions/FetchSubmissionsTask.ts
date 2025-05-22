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
  Workflow,
} from "@ellmers/task-graph";
import { FetchTaskOutput } from "@ellmers/tasks";
import { Static, TObject, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import {
  CompanySubmissionSchema,
  Filings,
  FullCompanySubmissionSchema,
  TypeFilings,
  TypeSecCik,
} from "../../types/CompanySubmission";
import { secDate, TypeOptionalSecDate } from "../../util/parseDate";
import { SecFetchSubmissionsTask } from "./SecFetchSubmissionsTask";

// NOTE: company submissions are mutable, so we need to pass in a date to break the cache

const FetchSubmissionsTaskInputSchema = () =>
  Type.Object({
    cik: TypeSecCik(),
    date: TypeOptionalSecDate(),
  });

export type FetchSubmissionsTaskInput = Static<ReturnType<typeof FetchSubmissionsTaskInputSchema>>;

const FetchSubmissionsTaskOutputSchema = () =>
  Type.Object({
    submission: CompanySubmissionSchema(),
    filings: TypeFilings(),
  });

export type FetchSubmissionsOutput = Static<ReturnType<typeof FetchSubmissionsTaskOutputSchema>>;

export class FetchSubmissionsTask extends Task<FetchSubmissionsTaskInput, FetchSubmissionsOutput> {
  static readonly type = "FetchSubmissionsTask";
  static readonly category = "SEC";
  static readonly cacheable = true;

  public static inputSchema(): TObject {
    return FetchSubmissionsTaskInputSchema();
  }

  public static outputSchema(): TObject {
    return FetchSubmissionsTaskOutputSchema();
  }

  async execute(
    input: FetchSubmissionsTaskInput,
    config: IExecuteConfig
  ): Promise<FetchSubmissionsOutput> {
    const cik = input.cik;
    if (!cik) throw new TaskFailedError("CIK is required");
    const date = input.date ? secDate(input.date) : undefined;

    const builder = config.own(new Workflow());
    builder.pipe(
      new SecFetchSubmissionsTask(input, {
        id: "fetch-company-submissions",
      }),
      async function cleanupInput(input) {
        try {
          const edgarJson = Value.Encode(FullCompanySubmissionSchema(), input.json);
          const { filings, ...submission } = edgarJson;
          const { recent, files } = filings;
          return { submission, filings: recent, files };
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      async function combineFilings(input, config) {
        const graph = config.own(new TaskGraph());
        graph.addTask(async function passThroughOriginalFilings() {
          return { filings: input.filings };
        });
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
            async function reduceFilings(input: FetchTaskOutput, config: IExecuteConfig) {
              // example submissions/CIK0000001750-submissions-001.json
              const filings = Value.Encode(TypeFilings(), input.json);
              return {
                filings: filings,
              };
            },
            { id: `parse-${fileName}` }
          );
          graph.addDataflow(new Dataflow(`fetch-${fileName}`, "json", `parse-${fileName}`, "json"));
        }

        const graphResult = await graph.run();
        let allFilings: { [key: string]: any[] } = {};
        for (const result of graphResult) {
          const { filings } = result.data as { filings: Filings };
          for (const key of Object.keys(filings)) {
            if (!allFilings[key]) {
              allFilings[key] = [];
            }
            allFilings[key].push(...filings[key as keyof Filings]);
          }
        }

        return { submission: input.submission, filings: allFilings };
      }
    );
    const output = await builder.run();
    return output as FetchSubmissionsOutput;
  }
}
