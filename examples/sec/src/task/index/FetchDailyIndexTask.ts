//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task } from "@ellmers/task-graph";
import { TObject, Type } from "@sinclair/typebox";
import { parse } from "csv-parse/sync";
import { response_type, SecCachedFetchTask } from "../../fetch/SecCachedFetchTask";
import { TypeSecCik } from "../../types/CompanySubmission";
import {
  parseDate,
  secDate,
  TypeOptionalSecDate,
  TypeSecDate,
  YYYYdMMdDD,
} from "../../util/parseDate";

// NOTE: daily index is immutable, but date is part of the url

export type FetchDailyIndexTaskInput = {
  date: string;
};

export type FetchDailyIndexTaskOutput = {
  updateList: [cik: number, last_known_update: string][];
};

class SecFetchDailyIndexTask extends SecCachedFetchTask<FetchDailyIndexTaskInput> {
  static readonly type = "SecFetchDailyIndexTask";
  static readonly category = "Hidden";
  static readonly immutable = false;

  response_type: response_type = "text";

  public static inputSchema(): TObject {
    return Type.Object({
      date: TypeSecDate({
        title: "Date",
        description: "The date to fetch the daily index for",
      }),
    });
  }

  inputToFileName(input: FetchDailyIndexTaskInput): string {
    const { year, month, day } = parseDate(input.date);
    return `daily-index/${year}/${year}-${month}-${day}.master.idx`;
  }
  inputToUrl(input: FetchDailyIndexTaskInput): string {
    const { year, month, day } = parseDate(input.date);
    const quarter = Math.ceil(parseInt(month) / 3);
    return `https://www.sec.gov/Archives/edgar/daily-index/${year}/QTR${quarter}/master.${year}${month}${day}.idx`;
  }
}

/**
 * Task for fetching the daily index of SEC filings and parsing it into a list of CIKs to update
 */
export class FetchDailyIndexTask extends Task<FetchDailyIndexTaskInput, FetchDailyIndexTaskOutput> {
  static readonly type = "FetchDailyIndexTask";
  static readonly category = "SEC";
  static readonly cacheable = true;

  public static inputSchema(): TObject {
    return Type.Object({
      date: TypeOptionalSecDate({
        title: "Date",
        description: "The date to fetch the daily index for",
      }),
    });
  }

  public static outputSchema(): TObject {
    return Type.Object({
      updateList: Type.Array(Type.Tuple([TypeSecCik(), TypeSecDate()])),
    });
  }

  async execute(
    input: FetchDailyIndexTaskInput,
    config: IExecuteConfig
  ): Promise<FetchDailyIndexTaskOutput> {
    const date = input.date ? secDate(input.date) : secDate(new Date());

    const secFetch = config.own(new SecFetchDailyIndexTask({ date }));
    const secData = await secFetch.run();
    let data = secData.text!;
    let loc = data.indexOf("-------");
    loc = data.indexOf("\n", loc + 1);
    data = data.slice(loc);

    const records = parse(data, {
      delimiter: "|",
      relax_column_count: false,
      quote: "¬",
      skip_empty_lines: true,
      skip_records_with_error: true,
    });

    const updates = new Set();
    for (let record of records) {
      const cikStr = record[0];
      const cik = parseInt(cikStr);
      updates.add(cik);
    }
    const updateList = Array.from(updates).map((cik) => [cik, date] as [number, YYYYdMMdDD]);
    return { updateList };
  }
}
