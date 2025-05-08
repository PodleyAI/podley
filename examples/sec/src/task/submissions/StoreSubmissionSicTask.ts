//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError, TaskError } from "@ellmers/task-graph";
import { processSubmissionSic } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { TObject, Type } from "@sinclair/typebox";

export type StoreSubmissionSicTaskInput = FetchSubmissionsOutput;

export type StoreSubmissionSicTaskOutput = {
  success: boolean;
};

/**
 * Task for storing company sic
 */
export class StoreSubmissionSicTask extends Task<
  StoreSubmissionSicTaskInput,
  StoreSubmissionSicTaskOutput
> {
  static readonly type = "StoreSubmissionSicTask";
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
    input: StoreSubmissionSicTaskInput,
    config: IExecuteConfig
  ): Promise<StoreSubmissionSicTaskOutput> {
    if (config.signal?.aborted) {
      throw new TaskAbortedError();
    }
    let { submission } = input;
    if (Array.isArray(submission)) {
      submission = submission[0];
    }
    if (!submission) throw new TaskError("No submission data");

    const { sic, sicDescription } = submission;
    if (sic && sicDescription) {
      processSubmissionSic(sic, sicDescription);
    } else {
      return { success: false };
    }

    return { success: true };
  }
}
