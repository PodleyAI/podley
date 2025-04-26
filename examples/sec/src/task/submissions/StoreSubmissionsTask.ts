//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError, Workflow, parallel } from "@ellmers/task-graph";
import { processUpdateProcessing } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { StoreSubmissionCikNameTask } from "./StoreSubmissionCikNameTask";
import { StoreSubmissionContactInfoTask } from "./StoreSubmissionContactInfoTask";
import { StoreSubmissionEntitiesTask } from "./StoreSubmissionEntitiesTask";
import { StoreSubmissionFilingsTask } from "./StoreSubmissionFilingsTask";
import { StoreSubmissionSicTask } from "./StoreSubmissionSicTask";
import { StoreSubmissionTickersTask } from "./StoreSubmissionTickersTask";

export type StoreSubmissionsTaskInput = FetchSubmissionsOutput;

export type StoreSubmissionsTaskOutput = {
  success: boolean;
};

export class StoreSubmissionsTask extends Task<
  StoreSubmissionsTaskInput,
  StoreSubmissionsTaskOutput
> {
  static readonly type = "StoreSubmissionsTask";
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
    input: StoreSubmissionsTaskInput,
    config: IExecuteConfig
  ): Promise<StoreSubmissionsTaskOutput> {
    if (config.signal?.aborted) {
      throw new TaskAbortedError();
    }
    let { submission } = input;
    if (Array.isArray(submission)) {
      submission = submission[0];
    }
    if (!submission) return { success: false };
    const cik = parseInt(submission.cik);

    const workflow = config.own(new Workflow());
    workflow.pipe(
      parallel([
        new StoreSubmissionCikNameTask(input),
        new StoreSubmissionSicTask(input),
        new StoreSubmissionEntitiesTask(input),
        new StoreSubmissionContactInfoTask(input),
        new StoreSubmissionTickersTask(input),
        new StoreSubmissionFilingsTask(input),
      ]),
      function updateProcessing() {
        processUpdateProcessing(cik);
        return { success: true };
      }
    );
    await workflow.run();

    // TODO: check if any tasks failed

    return { success: true };
  }
}
