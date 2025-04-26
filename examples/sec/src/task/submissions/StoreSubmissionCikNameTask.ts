//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { processCikName } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";

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

  static readonly inputs = FetchSubmissionsTask.outputs;
  static readonly outputs = [
    {
      id: "success",
      name: "Success",
      valueType: "boolean",
    },
  ];

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
    if (!submission) return { success: false };
    const cik = parseInt(submission.cik);
    const name = submission.name;
    processCikName(cik, name);
    return { success: true };
  }
}
