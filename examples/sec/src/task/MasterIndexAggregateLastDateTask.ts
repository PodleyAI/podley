//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { parse } from "csv-parse";
import { createReadStream } from "fs";

// NOTE: master index is immutable, but date is part of the url

type MasterIndexAggregateLastDateTaskInput = {
  file_name: string;
};

type MasterIndexAggregateLastDateTaskOutput = {
  cik_date_entries: [cik: number, last_known_update: string][];
};

/**
 * Task for fetching the daily index of SEC filings and parsing it into a list of CIKs to update
 * https://drive.google.com/file/d/1AACMSlrZiHvQ3ai8Vo6CTqTC0tUOGR1H/view?usp=sharing
 * https://sraf.nd.edu/sec-edgar-data/master-index-data/
 */
export class MasterIndexAggregateLastDateTask extends Task<
  MasterIndexAggregateLastDateTaskInput,
  MasterIndexAggregateLastDateTaskOutput
> {
  static readonly type = "MasterIndexAggregateLastDateTask";
  static readonly category = "SEC";
  static readonly cacheable = true;

  async execute(input: MasterIndexAggregateLastDateTaskInput, config: IExecuteConfig) {
    const linecountestimate = 25000000;
    const cikMap = new Map<number, string>();

    const parser = parse({
      delimiter: "|",
      relax_quotes: true,
      trim: true,
      cast: (value, context) => {
        // Convert CIK to a number for easier comparisons
        if (context.index === 0) return Number(value);
        return value;
      },
    });

    const stream = createReadStream(input.file_name);
    let progress = 0;
    let index = 0;
    for await (const record of stream.pipe(parser)) {
      const [cik, , , date] = record as [number, string, string, string];
      const last_date = cikMap.get(cik);
      if (last_date === undefined || last_date < date) {
        cikMap.set(cik, date);
      }

      if (config.signal?.aborted) {
        throw new TaskAbortedError();
      }
      const newProgress = Math.round((index++ / linecountestimate) * 100);
      if (newProgress > progress) {
        config.updateProgress(newProgress, `date: ${date}`);
        progress = newProgress;
      }
    }

    return { cik_date_entries: Array.from(cikMap.entries()) };
  }
}
