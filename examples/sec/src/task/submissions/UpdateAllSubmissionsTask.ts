//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, IWorkflow, pipe, Task } from "@ellmers/task-graph";
import { TObject, Type } from "@sinclair/typebox";
import { query_all, query_run } from "../../util/db";
import { parseDate } from "../../util/parseDate";
import { FetchSubmissionsTask } from "./FetchSubmissionsTask";
import { StoreSubmissionsTask } from "./StoreSubmissionsTask";

export type UpdateAllSubmissionsTaskInput = {};

export type UpdateAllSubmissionsTaskOutput = {
  success: boolean;
};

/**
 * Task for storing company facts
 */
export class UpdateAllSubmissionsTask extends Task<
  UpdateAllSubmissionsTaskInput,
  UpdateAllSubmissionsTaskOutput
> {
  static readonly type = "UpdateAllSubmissionsTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  public static outputSchema(): TObject {
    return Type.Object({
      success: Type.Boolean(),
    });
  }

  async execute(
    input: UpdateAllSubmissionsTaskInput,
    config: IExecuteConfig
  ): Promise<UpdateAllSubmissionsTaskOutput> {
    const needsUpating = query_all(`
      SELECT cik_last_update.cik, cik_last_update.last_update, processed_submissions.last_processed FROM cik_last_update 
        JOIN processed_submissions 
          ON cik_last_update.cik = processed_submissions.cik
        WHERE cik_last_update.last_update > processed_submissions.last_processed 
        ORDER BY cik_last_update.last_update DESC`);

    if (needsUpating?.length) {
      const wf = config.own(pipe([new FetchSubmissionsTask(), new StoreSubmissionsTask()]));
      for (const result of needsUpating) {
        try {
          await wf.run({ cik: result.cik, date: result.last_update });
        } catch (e) {
          const { year, month, day } = parseDate(result.last_update);
          query_run(
            `INSERT OR REPLACE INTO processed_submissions(cik,last_processed)
            VALUES($cik,$last_processed)`,
            {
              $cik: result.cik,
              $last_processed: `${year + 1}-${month}-${day}`,
            }
          );
        }
      }
    }

    const needsInitialProcessing = query_all<{
      cik: string;
      last_update: string;
      last_processed: string;
    }>(`
      SELECT cik_last_update.cik, cik_last_update.last_update, processed_submissions.last_processed FROM cik_last_update
        LEFT JOIN processed_submissions
          ON cik_last_update.cik = processed_submissions.cik
        WHERE processed_submissions.last_processed IS NULL
        ORDER BY cik_last_update.last_update DESC`);

    if (needsInitialProcessing?.length) {
      const BATCH_SIZE = 2;
      const workflowsNumber = Math.min(needsInitialProcessing.length, BATCH_SIZE);
      const workflows: IWorkflow<any, any>[] = [];
      for (let i = 0; i < workflowsNumber; i++) {
        workflows.push(config.own(pipe([new FetchSubmissionsTask(), new StoreSubmissionsTask()])));
      }
      for (let i = 0; i < needsInitialProcessing.length; i += BATCH_SIZE) {
        const batch = needsInitialProcessing.slice(i, i + BATCH_SIZE);
        const promises = [];
        for (let j = 0; j < batch.length; j++) {
          promises.push(
            runWorkflow(workflows[j], {
              cik: batch[j].cik,
              date: batch[j].last_update,
            })
          );
        }
        await Promise.all(promises);
      }
    }
    return { success: true };
  }
}

async function runWorkflow(wf: IWorkflow<any, any>, input: { cik: string; date: string }) {
  try {
    const result = await wf.run(input);
    return result;
  } catch (e) {
    const { year, month, day } = parseDate(input.date);
    query_run(
      `INSERT OR REPLACE INTO processed_submissions(cik,last_processed)
        VALUES($cik,$last_processed)`,
      {
        $cik: input.cik,
        $last_processed: `${year + 1}-${month}-${day}`,
      }
    );
  }
}
