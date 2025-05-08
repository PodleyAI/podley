//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError, TaskError } from "@ellmers/task-graph";
import { processSubmissionEntity } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { TObject, Type } from "@sinclair/typebox";

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

  static inputSchema(): TObject {
    return FetchSubmissionsTask.outputSchema();
  }

  static outputSchema(): TObject {
    return Type.Object({
      success: Type.Boolean({ title: "Successful" }),
    });
  }

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
    if (!submission) throw new TaskError("No submission data");

    processSubmissionEntity(submission);

    return { success: true };
  }
}
