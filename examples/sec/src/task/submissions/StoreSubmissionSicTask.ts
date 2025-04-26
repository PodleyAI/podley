//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { processSubmissionSic } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";

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

  static readonly inputs = FetchSubmissionsTask.outputs;
  static readonly outputs = [
    {
      id: "success",
      name: "Success",
      valueType: "boolean",
    },
  ];

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
    if (!submission) return { success: false };

    const { sic, sicDescription } = submission;
    if (sic && sicDescription) {
      processSubmissionSic(sic, sicDescription);
    } else {
      return { success: false };
    }

    return { success: true };
  }
}
