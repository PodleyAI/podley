//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError, TaskError } from "@ellmers/task-graph";
import { insertAddress, insertPhone } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { TObject, Type } from "@sinclair/typebox";

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

  static inputSchema(): TObject {
    return FetchSubmissionsTask.outputSchema();
  }

  static outputSchema(): TObject {
    return Type.Object({
      success: Type.Boolean({ title: "Successful" }),
    });
  }

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
    if (!submission) throw new TaskError("No submission data");
    const cik = submission.cik;

    if (submission.phone) {
      insertPhone(submission.phone, "entity:contact", cik);
    }

    for (const [kind, address] of Object.entries(submission.addresses)) {
      if (address) insertAddress(address, "entity:" + kind, cik);
    }

    return { success: true };
  }
}
