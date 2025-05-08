//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task } from "@ellmers/task-graph";
import { TypeDateTime } from "@ellmers/util";
import { TObject, Type } from "@sinclair/typebox";
import { parse } from "csv-parse/sync";
import { response_type, SecCachedFetchTask } from "../../fetch/SecCachedFetchTask";
import { parseDate } from "../../util/parseDate";
import { TypeSecCik } from "../../types/CompanySubmission";

// NOTE: ONLY PREVIOUS QUARTYS master index are immutable, current one is not (though should switch to daily)

export type FetchQuarterlyIndexTaskInput = {
  date: string;
};

export type FetchQuarterlyIndexTaskOutput = {
  updateList: [cik: number, last_known_update: string][];
};

class SecFetchQuarterlyIndexTask extends SecCachedFetchTask<FetchQuarterlyIndexTaskInput> {
  static readonly type = "SecFetchQuarterlyIndexTask";
  static readonly category = "Hidden";
  static readonly immutable = false;

  response_type: response_type = "text";

  public static inputSchema(): TObject {
    return Type.Object({
      date: Type.Optional(
        TypeDateTime({
          title: "Date",
          description: "The date to fetch the quarterly index for",
        })
      ),
    });
  }

  inputToFileName(input: FetchQuarterlyIndexTaskInput): string {
    const { year, month, day } = parseDate(input.date);
    const quarter = Math.ceil(parseInt(month) / 3);
    return `quarterly-index/${year}-QTR${quarter}.master.idx`;
  }
  inputToUrl(input: FetchQuarterlyIndexTaskInput): string {
    const { year, month, day } = parseDate(input.date);
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
      date: Type.Optional(TypeDateTime()),
    });
  }

  public static outputSchema(): TObject {
    return Type.Object({
      updateList: Type.Array(Type.Tuple([TypeSecCik(), TypeDateTime()])),
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

    // const cikMap = new Map<number, string>();

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

    const updates: Record<string, string> = {};
    for (let record of records) {
      const cikStr = record[0];
      const date = record[3] as string;
      // we do not need to check if the date is newer than the last known date, because the index is sorted by date
      updates[cikStr] = date;
    }
    const updateList = Object.entries(updates).map(([cik, date]) => [parseInt(cik), date]) as [
      number,
      string,
    ][];
    return { updateList };

    // const stream = createReadStream(input.file_name);
    // let progress = 0;
    // let index = 0;
    // for await (const record of stream.pipe(parser)) {
    //   const [cik, , , date] = record as [number, string, string, string];
    //   const last_date = cikMap.get(cik);
    //   if (last_date === undefined || last_date < date) {
    //     cikMap.set(cik, date);
    //   }

    //   if (config.signal?.aborted) {
    //     throw new TaskAbortedError();
    //   }
    //   const newProgress = Math.round((index++ / linecountestimate) * 100);
    //   if (newProgress > progress) {
    //     config.updateProgress(newProgress, `date: ${date}`);
    //     progress = newProgress;
    //   }
    // }
    // return { updateList: Array.from(cikMap.entries()) };
  }
}
