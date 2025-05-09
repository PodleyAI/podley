//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { sleep, TypeDateTime } from "@ellmers/util";
import { TObject, Type } from "@sinclair/typebox";
import { TypeSecCik } from "../../types/CompanySubmission";
import { query_run } from "../../util/db";
import { TypeSecDate, YYYYdMMdDD } from "../../util/parseDate";

export type StoreCikLastUpdatedTaskOutput = {
  success: boolean;
};

export type StoreCikLastUpdatedTaskInput = {
  updateList: [cik: number, last_known_update: YYYYdMMdDD][];
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

  public static inputSchema(): TObject {
    return Type.Object({
      updateList: Type.Array(Type.Tuple([TypeSecCik(), TypeSecDate()])),
    });
  }

  public static outputSchema(): TObject {
    return Type.Object({
      success: Type.Boolean(),
    });
  }

  async execute(
    input: StoreCikLastUpdatedTaskInput,
    config: IExecuteConfig
  ): Promise<StoreCikLastUpdatedTaskOutput> {
    const updateList = input.updateList.filter(Boolean);
    if (!updateList || updateList.length === 0) return { success: false };

    const length = updateList.length;
    let progress = 0;
    let index = 0;
    const batchSize = 1000;
    const batches = Math.ceil(length / batchSize);
    for (let i = 0; i < batches; i++) {
      if (config.signal?.aborted) {
        throw new TaskAbortedError();
      }
      const batch = updateList
        .slice(i * batchSize, (i + 1) * batchSize)
        .filter(Boolean)
        .map(([cik, last_known_update]) => {
          return {
            $cik: cik,
            $last_update: last_known_update,
          };
        });

      query_run(
        `INSERT OR REPLACE INTO cik_last_update(cik,last_update)
          VALUES($cik,$last_update)`,
        batch
      );
      const newProgress = Math.round((index++ / length) * 1000) / 10;
      if (newProgress > progress) {
        config.updateProgress(newProgress);
        progress = newProgress;
        await sleep(0);
      }
    }
    return { success: true };
  }
}
