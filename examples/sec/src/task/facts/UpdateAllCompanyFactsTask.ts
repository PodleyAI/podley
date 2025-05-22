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
import { FetchCompanyFactsTask } from "./FetchCompanyFactsTask";
import { StoreCompanyFactsTask } from "./StoreCompanyFactsTask";
import { sleep } from "@ellmers/util";

export type UpdateAllCompanyFactsTaskInput = {};

export type UpdateAllCompanyFactsTaskOutput = {
  success: boolean;
};

/**
 * Task for storing company facts
 */
export class UpdateAllCompanyFactsTask extends Task<
  UpdateAllCompanyFactsTaskInput,
  UpdateAllCompanyFactsTaskOutput
> {
  static readonly type = "UpdateAllCompanyFactsTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  public static outputSchema(): TObject {
    return Type.Object({
      success: Type.Boolean(),
    });
  }

  async execute(
    input: UpdateAllCompanyFactsTaskInput,
    config: IExecuteConfig
  ): Promise<UpdateAllCompanyFactsTaskOutput> {
    const needsUpating = query_all(`
      SELECT cik_last_update.cik, cik_last_update.last_update, processed_facts.last_processed FROM cik_last_update 
        JOIN processed_facts 
          ON cik_last_update.cik = processed_facts.cik
        WHERE cik_last_update.last_update > processed_facts.last_processed 
        ORDER BY cik_last_update.last_update DESC`);
    const needsUpatingCount = needsUpating?.length ?? 0;

    const needsProcessing = query_all<{
      cik: string;
      last_update: string;
      last_processed: string;
    }>(`
          SELECT cik_last_update.cik, cik_last_update.last_update, processed_facts.last_processed FROM cik_last_update
            LEFT JOIN processed_facts
              ON cik_last_update.cik = processed_facts.cik
            WHERE processed_facts.last_processed IS NULL
            ORDER BY cik_last_update.last_update DESC`);
    const needsProcessingCount = needsProcessing?.length ?? 0;
    const totalCount = needsUpatingCount + needsProcessingCount;

    if (needsUpatingCount) {
      const wf = config.own(pipe([new FetchCompanyFactsTask(), new StoreCompanyFactsTask()]));
      for (let i = 0; i < needsUpatingCount; i++) {
        const result = needsUpating[i];
        try {
          await wf.run({ cik: result.cik, date: result.last_update });
        } catch (e) {
          const { year, month, day } = parseDate(result.last_update);
          query_run(
            `INSERT OR REPLACE INTO processed_facts(cik,last_processed)
            VALUES($cik,$last_processed)`,
            {
              $cik: result.cik,
              $last_processed: `${year + 1}-${month}-${day}`,
            }
          );
        }
        await sleep(0);
        config.updateProgress(
          Math.ceil((i / totalCount) * 100),
          `Processed ${i} of ${totalCount} company facts (updating)`
        );
      }
    }

    if (needsProcessing?.length) {
      const BATCH_SIZE = 10;
      const workflowsNumber = Math.min(needsProcessing.length, BATCH_SIZE);
      const workflows: IWorkflow<any, any>[] = [];
      for (let i = 0; i < workflowsNumber; i++) {
        workflows.push(
          config.own(pipe([new FetchCompanyFactsTask(), new StoreCompanyFactsTask()]))
        );
      }
      for (let i = 0; i < needsProcessing.length; i += BATCH_SIZE) {
        const batch = needsProcessing.slice(i, i + BATCH_SIZE);
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
        await sleep(0);
        config.updateProgress(
          Math.ceil(((i + needsUpatingCount) / totalCount) * 100),
          `Processed ${i + needsUpatingCount} of ${totalCount} company facts (initial processing)`
        );
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
      `INSERT OR REPLACE INTO processed_facts(cik,last_processed)
        VALUES($cik,$last_processed)`,
      {
        $cik: input.cik,
        $last_processed: `${year + 1}-${month}-${day}`,
      }
    );
  }
}
