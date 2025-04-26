//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { processSubmissionEntity } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";

export type StoreSubmissionEntitiesTaskInput = FetchSubmissionsOutput;

export type StoreSubmissionEntitiesTaskOutput = {
  success: boolean;
};

export class StoreSubmissionEntitiesTask extends Task<
  StoreSubmissionEntitiesTaskInput,
  StoreSubmissionEntitiesTaskOutput
> {
  static readonly type = "StoreSubmissionEntitiesTask";
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
    input: StoreSubmissionEntitiesTaskInput,
    config: IExecuteConfig
  ): Promise<StoreSubmissionEntitiesTaskOutput> {
    if (config.signal?.aborted) {
      throw new TaskAbortedError();
    }
    let { submission } = input;
    if (Array.isArray(submission)) {
      submission = submission[0];
    }
    if (!submission) return { success: false };

    processSubmissionEntity(submission);

    return { success: true };
  }
}
