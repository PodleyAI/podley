//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { Static, TObject, Type } from "@sinclair/typebox";
import { SecCachedFetchTask } from "../../fetch/SecCachedFetchTask";
import { SecFetchTask } from "../../fetch/SecFetchTask";
import { TypeSecCik } from "../../types/CompanySubmission";
import { TypeSecDate } from "../../util/parseDate";

// NOTE: cik names are mutable, so we use date to break the cache

const FetchAllCikNamesTaskInputSchema = () =>
  Type.Object({
    date: Type.Optional(TypeSecDate()),
  });

const FetchAllCikNamesTaskOutputSchema = () =>
  Type.Object({
    cikList: Type.Array(Type.Object({ name: Type.String(), cik: TypeSecCik() })),
  });

export type FetchAllCikNamesTaskInput = Static<ReturnType<typeof FetchAllCikNamesTaskInputSchema>>;
export type FetchAllCikNamesTaskOutput = Static<
  ReturnType<typeof FetchAllCikNamesTaskOutputSchema>
>;

export class SecFetchCikLookupTask extends SecCachedFetchTask<
  FetchAllCikNamesTaskInput,
  FetchAllCikNamesTaskOutput
> {
  static readonly type = "SecFetchCikLookupTask";
  static readonly category = "Hidden";
  static readonly immutable = true;

  public static inputSchema(): TObject {
    return FetchAllCikNamesTaskInputSchema();
  }

  inputToFileName(input: FetchAllCikNamesTaskInput): string {
    return `cik-lookup-data.txt`;
  }

  inputToUrl(input: FetchAllCikNamesTaskInput): string {
    const date = input.date || new Date().toISOString().split("T")[0];
    return `https://www.sec.gov/Archives/edgar/cik-lookup-data.txt${date ? `?date=${date}` : ""}`;
  }
}

export class FetchAllCikNamesTask extends Task<
  FetchAllCikNamesTaskInput,
  FetchAllCikNamesTaskOutput
> {
  static readonly type = "FetchAllCikNamesTask";
  static readonly category = "SEC";
  static readonly cacheable = true;
  static readonly compoundMerge = "last";

  public static inputSchema(): TObject {
    return FetchAllCikNamesTaskInputSchema();
  }

  public static outputSchema(): TObject {
    return FetchAllCikNamesTaskOutputSchema();
  }

  async execute(
    input: FetchAllCikNamesTaskInput,
    config: IExecuteConfig
  ): Promise<FetchAllCikNamesTaskOutput> {
    const secFetch = config.own(
      new SecFetchTask({
        url: `https://www.sec.gov/Archives/edgar/cik-lookup-data.txt${input.date ? `?date=${input.date}` : ""}`,
        response_type: "text",
      })
    );
    const secData = await secFetch.run();
    const secText = secData.text!;
    const lines = secText.split("\n");
    let index = 0;
    let progress = 0;
    const cikList = lines.map((line: string) => {
      if (config.signal.aborted) {
        throw new TaskAbortedError();
      }
      const colonIndex = line.lastIndexOf(":", line.lastIndexOf(":") - 1);
      const name = line.substring(0, colonIndex).trim();
      const cik = line.substring(colonIndex + 1, line.length - 1);
      const newProgress = Math.round((index++ / lines.length) * 100);
      if (newProgress > progress) {
        // round numbers, so max 100 times
        config.updateProgress(newProgress, `cik: ${cik}`);
        progress = newProgress;
      }
      return { name: name ? name.trim() : "?", cik: Number(cik) };
    });
    return { cikList };
  }
}
