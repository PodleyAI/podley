//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { parse } from "csv-parse/sync";
import { SecFetchTask } from "../fetch/SecFetchTask";
import { parseDate } from "../util/parseDate";

// NOTE: daily index is immutable, but date is part of the url

type FetchDailyIndexTaskInput = {
  date: string;
  limit?: number;
};

type FetchDailyIndexTaskOutput = {
  last_known_update: string;
  updateList: number[];
};

/**
 * Task for fetching the daily index of SEC filings and parsing it into a list of CIKs to update
 */
export class FetchDailyIndexTask extends Task<FetchDailyIndexTaskInput, FetchDailyIndexTaskOutput> {
  static readonly type = "FetchDailyIndexTask";
  static readonly category = "SEC";
  static readonly cacheable = true;

  async execute(
    input: FetchDailyIndexTaskInput,
    config: IExecuteConfig
  ): Promise<FetchDailyIndexTaskOutput> {
    if (!input.date) return { last_known_update: "", updateList: [] };

    const { year, month, day } = parseDate(input.date);
    const quarter = Math.ceil(parseInt(month) / 3);
    const limit = input.limit;

    const secFetch = config.own(new SecFetchTask());
    const secData = await secFetch.run({
      url: `https://www.sec.gov/Archives/edgar/daily-index/${year}/QTR${quarter}/master.${year}${month}${day}.idx`,
      response_type: "text",
    });
    let data = secData.text!;
    let loc = data.indexOf("-------");
    loc = data.indexOf("\n", loc + 1);
    data = data.slice(loc);

    let records = parse(data, {
      delimiter: "|",
      relax_column_count: false,
      quote: "¬",
      skip_empty_lines: true,
      skip_records_with_error: true,
    });

    const max = limit && limit < records.length ? limit : records.length;
    records = records.slice(0, max);
    const updates = new Set();
    let progress = 0;
    let index = 0;
    let last_known_update = "";
    for (let record of records) {
      if (config.signal?.aborted) {
        throw new TaskAbortedError();
      }
      const cikStr = record[0];
      const cik = parseInt(cikStr);
      last_known_update = record[3];
      const newProgress = Math.round((index++ / records.length) * 100);
      if (newProgress > progress) {
        // round numbers, so max 100 times
        config.updateProgress(newProgress, `${last_known_update} / cik: ${cik}`);
        progress = newProgress;
      }
      updates.add(cik);
    }
    const updateList = Array.from(updates) as number[];
    return { last_known_update, updateList };
  }
}
