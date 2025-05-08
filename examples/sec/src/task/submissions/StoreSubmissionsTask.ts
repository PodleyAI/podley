//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  IExecuteConfig,
  Task,
  TaskAbortedError,
  TaskError,
  Workflow,
  parallel,
} from "@ellmers/task-graph";
import { processUpdateProcessing } from "../../util/commonStoreSec";
import { FetchSubmissionsOutput, FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { StoreSubmissionCikNameTask } from "./StoreSubmissionCikNameTask";
import { StoreSubmissionContactInfoTask } from "./StoreSubmissionContactInfoTask";
import { StoreSubmissionEntitiesTask } from "./StoreSubmissionEntitiesTask";
import { StoreSubmissionFilingsTask } from "./StoreSubmissionFilingsTask";
import { StoreSubmissionSicTask } from "./StoreSubmissionSicTask";
import { StoreSubmissionTickersTask } from "./StoreSubmissionTickersTask";
import { TObject, Type } from "@sinclair/typebox";

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

  static inputSchema(): TObject {
    return FetchSubmissionsTask.outputSchema();
  }

  static outputSchema(): TObject {
    return Type.Object({
      success: Type.Boolean({ title: "Successful" }),
    });
  }

  async execute(
    input: StoreSubmissionsTaskInput,
    config: IExecuteConfig
  ): Promise<StoreSubmissionsTaskOutput> {
    if (config.signal?.aborted) {
      throw new TaskAbortedError();
    }
    let { submission } = input;
    if (!submission) throw new TaskError("No submission data");
    const cik = submission.cik;

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
    return { success: true };
  }
}
