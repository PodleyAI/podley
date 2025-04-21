//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  IExecuteConfig,
  Task,
  TaskAbortedError,
  TaskInput,
  TaskInputDefinition,
  TaskOutput,
  TaskOutputDefinition,
} from "@ellmers/task-graph";
import { SecCachedFetchTask, SecCachedFetchTaskInput } from "../fetch/SecCachedFetchTask";
import { SecFetchTask } from "../fetch/SecFetchTask";

// NOTE: cik names are mutable, so we use date to break the cache

interface FetchAllCikNamesTaskInput extends TaskInput {
  date?: string;
}

export interface FetchAllCikNamesTaskOutput extends TaskOutput {
  cikList: { name: string; cik: number }[];
}

export class SecFetchCikLookupTask extends SecCachedFetchTask<
  FetchAllCikNamesTaskInput & SecCachedFetchTaskInput
> {
  static readonly type = "SecFetchCikLookupTask";
  static readonly category = "Hidden";
  static readonly immutable = true;

  public static inputs: TaskInputDefinition[] = [
    {
      id: "date",
      name: "Date",
      valueType: "string",
    },
  ] as const;

  public static outputs: TaskOutputDefinition[] = [
    {
      id: "cikList",
      name: "CIK List",
      valueType: "object",
      isArray: true,
    },
  ] as const;

  inputToFileName(input: { date?: string }): string {
    return `cik-lookup-data.txt`;
  }
  inputToUrl(input: { date?: string }): string {
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

  async execute(
    input: FetchAllCikNamesTaskInput,
    config: IExecuteConfig
  ): Promise<FetchAllCikNamesTaskOutput> {
    const secFetch = config.own(
      new SecFetchTask({
        url:
          (input.url ?? `https://www.sec.gov/Archives/edgar/cik-lookup-data.txt`) +
          (input.date ? `?date=${input.date}` : ""),
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
