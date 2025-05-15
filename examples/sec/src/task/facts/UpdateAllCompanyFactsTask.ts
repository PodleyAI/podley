//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  DataflowArrow,
  IExecuteConfig,
  IWorkflow,
  pipe,
  Task,
  TaskGraph,
} from "@ellmers/task-graph";
import { sleep } from "@ellmers/util";
import { TObject, Type } from "@sinclair/typebox";
import { query_all, query_run } from "../../util/db";
import { FetchCompanyFactsTask } from "./FetchCompanyFactsTask";
import { StoreCompanyFactsTask } from "./StoreCompanyFactsTask";
import { parseDate, secDate } from "../../util/parseDate";

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

    if (needsUpating?.length) {
      for (const result of needsUpating) {
        const cik = result.cik;
        const wf = config.own(
          pipe([
            new FetchCompanyFactsTask({ cik, date: result.last_update }),
            new StoreCompanyFactsTask({ cik, date: result.last_update }),
          ])
        );
        await sleep(0);
        try {
          await wf.run();
        } catch (e) {
          const { year, month, day } = parseDate(result.last_update);
          query_run(
            `INSERT OR REPLACE INTO processed_facts(cik,last_processed)
            VALUES($cik,$last_processed)`,
            {
              $cik: cik,
              $last_processed: `${year + 1}-${month}-${day}`,
            }
          );
        }
      }
    }

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

    if (needsProcessing?.length) {
      const BATCH_SIZE = 5;
      const workflowsNumber = Math.min(needsProcessing.length, BATCH_SIZE);
      const workflows: IWorkflow<any, any>[] = [];
      for (let i = 0; i < workflowsNumber; i++) {
        workflows.push(
          config.own(pipe([new FetchCompanyFactsTask(), new StoreCompanyFactsTask()]))
        );
      }
      for (let i = 0; i < needsProcessing.length; i += BATCH_SIZE) {
        const batch = needsProcessing.slice(i, i + BATCH_SIZE);
        for (let j = 0; j < batch.length; j++) {
          workflows[j].graph.resetGraph();
          workflows[j].graph.getTasks().forEach((task) => {
            task.setDefaults({ cik: batch[j].cik, date: batch[j].last_update });
          });
        }

        await sleep(0);

        // Run all workflows in parallel
        await Promise.all(
          workflows.map(async (wf, index) => {
            try {
              await wf.run();
            } catch (e) {
              const result = batch[index];
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
          })
        );
      }
    }

    return { success: true };
  }
}
