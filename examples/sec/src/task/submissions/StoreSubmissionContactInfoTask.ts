//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { insertAddress, insertPhone } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";

export type StoreSubmissionContactInfoTaskInput = FetchSubmissionsOutput;

export type StoreSubmissionContactInfoTaskOutput = {
  success: boolean;
};

export class StoreSubmissionContactInfoTask extends Task<
  StoreSubmissionContactInfoTaskInput,
  StoreSubmissionContactInfoTaskOutput
> {
  static readonly type = "StoreSubmissionContactInfoTask";
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
    input: StoreSubmissionContactInfoTaskInput,
    config: IExecuteConfig
  ): Promise<StoreSubmissionContactInfoTaskOutput> {
    if (config.signal?.aborted) {
      throw new TaskAbortedError();
    }
    let { submission } = input;
    if (Array.isArray(submission)) {
      submission = submission[0];
    }
    if (!submission) return { success: false };
    const cik = parseInt(submission.cik);

    insertPhone(submission.phone, "entity:contact", cik);

    for (const [kind, address] of Object.entries(submission.addresses)) {
      insertAddress(address, "entity:" + kind, cik);
    }

    return { success: true };
  }
}
