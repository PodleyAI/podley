//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError, TaskError } from "@ellmers/task-graph";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { processSubmissionTickers } from "../../util/commonStoreSec";
import { TObject, Type } from "@sinclair/typebox";
export type StoreSubmissionTickersTaskInput = FetchSubmissionsOutput;

export type StoreSubmissionTickersTaskOutput = {
  success: boolean;
};

export class StoreSubmissionTickersTask extends Task<
  StoreSubmissionTickersTaskInput,
  StoreSubmissionTickersTaskOutput
> {
  static readonly type = "StoreSubmissionTickersTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  static inputSchema(): TObject {
    return FetchSubmissionsTask.outputSchema();
  }

  static outputSchema(): TObject {
    return Type.Object({
      success: Type.Boolean({ title: "Successful" }),
    });
  }

  async execute(
    input: StoreSubmissionTickersTaskInput,
    config: IExecuteConfig
  ): Promise<StoreSubmissionTickersTaskOutput> {
    if (config.signal?.aborted) {
      throw new TaskAbortedError();
    }
    let { submission } = input;
    if (Array.isArray(submission)) {
      submission = submission[0];
    }
    if (!submission) throw new TaskError("No submission data");
    const cik = submission.cik;

    const { tickers, exchanges } = submission;
    if (tickers && exchanges) {
      for (const i in tickers) {
        const ticker = tickers[i];
        const exchange = exchanges[i];
        if (!ticker || !exchange) continue;
        processSubmissionTickers(cik, ticker, exchange);
      }
    }

    return { success: true };
  }
}
