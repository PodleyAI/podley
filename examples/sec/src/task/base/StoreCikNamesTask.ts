//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { query_run } from "../../util/db";
import { FetchAllCikNamesTask, FetchAllCikNamesTaskOutput } from "./FetchAllCikNamesTask";
import { TObject, Type } from "@sinclair/typebox";

export type StoreCikNamesTaskOutput = {
  success: boolean;
};

/**
 * Task for storing company facts
 */
export class StoreCikNamesTask extends Task<FetchAllCikNamesTaskOutput, StoreCikNamesTaskOutput> {
  static readonly type = "StoreCikNamesTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  public static inputSchema(): TObject {
    return FetchAllCikNamesTask.inputSchema();
  }

  public static outputSchema(): TObject {
    return Type.Object({
      success: Type.Boolean(),
    });
  }

  async execute(
    input: FetchAllCikNamesTaskOutput,
    config: IExecuteConfig
  ): Promise<StoreCikNamesTaskOutput> {
    const cikList: { cik: number; name: string }[] = input.cikList;
    if (!cikList) return { success: false };

    const estimatedFacts = cikList.length;
    let progress = 0;
    let index = 0;
    for (const { cik, name } of cikList) {
      if (config.signal?.aborted) {
        throw new TaskAbortedError();
      }
      query_run(
        `INSERT OR REPLACE INTO cik_names(cik,name)
          VALUES($cik,$name)`,
        {
          $cik: cik,
          $name: name,
        }
      );
      const newProgress = Math.round((index++ / estimatedFacts) * 100);
      if (newProgress > progress) {
        // round numbers, so max 100 times
        config.updateProgress(newProgress, `cik: ${cik}`);
        progress = newProgress;
      }
    }
    return { success: true };
  }
}
