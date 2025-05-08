//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError, TaskError } from "@ellmers/task-graph";
import { processCikName } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { TObject, Type } from "@sinclair/typebox";

export type StoreSubmissionCikNameTaskInput = FetchSubmissionsOutput;

export type StoreSubmissionCikNameTaskOutput = {
  success: boolean;
};

export class StoreSubmissionCikNameTask extends Task<
  StoreSubmissionCikNameTaskInput,
  StoreSubmissionCikNameTaskOutput
> {
  static readonly type = "StoreSubmissionCikNameTask";
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
    input: StoreSubmissionCikNameTaskInput,
    config: IExecuteConfig
  ): Promise<StoreSubmissionCikNameTaskOutput> {
    if (config.signal?.aborted) {
      throw new TaskAbortedError();
    }
    let { submission } = input;
    if (Array.isArray(submission)) {
      submission = submission[0];
    }
    if (!submission) throw new TaskError("No submission data");
    const cik = submission.cik;
    const name = submission.name;
    processCikName(cik, name);
    return { success: true };
  }
}
