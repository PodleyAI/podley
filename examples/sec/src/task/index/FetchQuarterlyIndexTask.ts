//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { TObject, Type } from "@sinclair/typebox";
import { response_type, SecCachedFetchTask } from "../../fetch/SecCachedFetchTask";
import {
  parseDate,
  secDate,
  TypeOptionalSecDate,
  TypeSecDate,
  YYYYdMMdDD,
} from "../../util/parseDate";
import { TypeSecCik } from "../../types/CompanySubmission";
import { parse } from "csv-parse";

// NOTE: ONLY PREVIOUS QUARTYS master index are immutable, current one is not (though should switch to daily)

export type FetchQuarterlyIndexTaskInput = {
  date: YYYYdMMdDD;
};

export type FetchQuarterlyIndexTaskOutput = {
  updateList: [cik: number, last_known_update: YYYYdMMdDD][];
};

class SecFetchQuarterlyIndexTask extends SecCachedFetchTask<FetchQuarterlyIndexTaskInput> {
  static readonly type = "SecFetchQuarterlyIndexTask";
  static readonly category = "Hidden";
  static readonly immutable = false;

  response_type: response_type = "text";

  public static inputSchema(): TObject {
    return Type.Object({
      date: TypeOptionalSecDate({
        title: "Date",
        description: "The date to fetch the quarterly index for",
      }),
    });
  }

  inputToFileName(input: FetchQuarterlyIndexTaskInput): string {
    const { year, month } = parseDate(input.date);
    const quarter = Math.ceil(parseInt(month) / 3);
    return `quarterly-index/${year}-QTR${quarter}.master.idx`;
  }
  inputToUrl(input: FetchQuarterlyIndexTaskInput): string {
    const { year, month } = parseDate(input.date);
    const quarter = Math.ceil(parseInt(month) / 3);
    return `https://www.sec.gov/Archives/edgar/full-index/${year}/QTR${quarter}/master.idx`;
  }
}

export class FetchQuarterlyIndexTask extends Task<
  FetchQuarterlyIndexTaskInput,
  FetchQuarterlyIndexTaskOutput
> {
  static readonly type = "FetchQuarterlyIndexTask";
  static readonly category = "SEC";
  static readonly cacheable = true;

  public static inputSchema(): TObject {
    return Type.Object({
      date: TypeOptionalSecDate({
        title: "Date",
        description: "The date to fetch the quarterly index for",
      }),
    });
  }

  public static outputSchema(): TObject {
    return Type.Object({
      updateList: Type.Array(Type.Tuple([TypeSecCik(), TypeSecDate()])),
    });
  }

  async execute(
    input: FetchQuarterlyIndexTaskInput,
    config: IExecuteConfig
  ): Promise<FetchQuarterlyIndexTaskOutput> {
    if (!input.date) return { updateList: [] };

    const secFetch = config.own(new SecFetchQuarterlyIndexTask({ date: input.date }));
    const secData = await secFetch.run();
    let data = secData.text!;
    let loc = data.indexOf("-------");
    loc = data.indexOf("\n", loc + 1);
    data = data.slice(loc);

    const options = {
      delimiter: "|",
      relax_column_count: false,
      quote: "¬",
      skip_empty_lines: true,
      skip_records_with_error: true,
    };

    return new Promise((resolve, reject) => {
      let totalRecords = data.match(/\n/g)?.length ?? 100;
      let rowCount = 0;
      let progress = 0;
      const cikMap = new Map<number, YYYYdMMdDD>();
      parse(
        data,
        {
          ...options,
          on_record: (record: any[]) => {
            const cikStr = parseInt(record[0]);
            const date = record[3];
            if (cikStr && date) {
              const currentDate = secDate(date);
              const prevDate = cikMap.get(cikStr);
              if (prevDate === undefined || prevDate < currentDate) {
                cikMap.set(cikStr, currentDate);
              }
            }

            rowCount += 1;
            totalRecords = Math.max(totalRecords, rowCount);
            const newProgress = Math.round((rowCount / totalRecords) * 100);
            if (newProgress > progress) {
              config.updateProgress(newProgress, `count: ${rowCount}`);
              progress = newProgress;
            }
            if (config.signal?.aborted) {
              throw new TaskAbortedError();
            }
          },
        },
        (err) => {
          if (err) reject(err);
          else resolve({ updateList: Array.from(cikMap.entries()) });
        }
      );
    });
  }
}
