//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { query_run } from "../../util/db";
import { sleep } from "@ellmers/util";

export type StoreCikLastUpdatedTaskOutput = {
  success: boolean;
};

export type StoreCikLastUpdatedTaskInput = {
  updateList: [cik: number, last_known_update: string][];
};

/**
 * Task for storing company facts
 */
export class StoreCikLastUpdatedTask extends Task<
  StoreCikLastUpdatedTaskInput,
  StoreCikLastUpdatedTaskOutput
> {
  static readonly type = "StoreCikLastUpdatedTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  static readonly inputs = [
    {
      id: "updateList",
      name: "Update List",
      valueType: "object",
      isArray: true,
    },
  ] as const;

  static readonly outputs = [
    {
      id: "success",
      name: "Success",
      valueType: "boolean",
    },
  ];

  async execute(
    input: StoreCikLastUpdatedTaskInput,
    config: IExecuteConfig
  ): Promise<StoreCikLastUpdatedTaskOutput> {
    const updateList = input.updateList;
    if (!updateList || updateList.length === 0) return { success: false };

    const length = updateList.length;
    let progress = 0;
    let index = 0;
    for (const [cik, last_known_update] of updateList) {
      if (config.signal?.aborted) {
        throw new TaskAbortedError();
      }
      query_run(
        `INSERT OR REPLACE INTO cik_last_update(cik,last_update)
          VALUES($cik,$last_update)`,
        {
          $cik: cik,
          $last_update: last_known_update,
        }
      );
      const newProgress = Math.round((index++ / length) * 1000) / 10;
      if (newProgress > progress) {
        config.updateProgress(newProgress, `cik: ${cik}`);
        progress = newProgress;
        await sleep(0);
      }
    }
    return { success: true };
  }
}
