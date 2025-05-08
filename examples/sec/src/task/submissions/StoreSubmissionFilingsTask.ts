//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError, TaskError } from "@ellmers/task-graph";
import { objectOfArraysAsArrayOfObjects, sleep } from "@ellmers/util";
import { processSubmissionFilings } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { TObject, Type } from "@sinclair/typebox";
import { Filings } from "../../types/CompanySubmission";

export type StoreSubmissionFilingsTaskInput = FetchSubmissionsOutput;

export type StoreSubmissionFilingsTaskOutput = {
  success: boolean;
};

export class StoreSubmissionFilingsTask extends Task<
  StoreSubmissionFilingsTaskInput,
  StoreSubmissionFilingsTaskOutput
> {
  static readonly type = "StoreSubmissionFilingsTask";
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
    input: StoreSubmissionFilingsTaskInput,
    config: IExecuteConfig
  ): Promise<StoreSubmissionFilingsTaskOutput> {
    let { submission } = input;
    if (Array.isArray(submission)) {
      submission = submission[0];
    }
    if (!submission) throw new TaskError("No submission data");
    const cik = submission.cik;

    let filings_array: Filings;
    if (Array.isArray(input.filings)) {
      filings_array = input.filings[0];
      for (let i = 1; i < input.filings.length; i++) {
        const filing = input.filings[i];
        // for each property, if it's an array, merge the arrays
        for (const key of Object.keys(filing)) {
          // @ts-ignore
          filings_array[key] = filings_array[key].concat(filing[key]);
        }
      }
    } else {
      filings_array = input.filings;
    }
    const filings = objectOfArraysAsArrayOfObjects(filings_array);
    let index = 0;
    let progress = 0;
    for (const filing of filings) {
      if (config.signal.aborted) {
        throw new TaskAbortedError();
      }
      const newProgress = Math.round((index++ / filings.length) * 10) * 10; // much faster than if we give up time for ui
      if (newProgress > progress) {
        config.updateProgress(newProgress);
        progress = newProgress;
        await sleep(0);
      }
      processSubmissionFilings(cik, filing);
    }

    return { success: true };
  }
}
