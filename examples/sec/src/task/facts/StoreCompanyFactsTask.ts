//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { Factoid } from "../../types/CompanyFacts";
import { query_run } from "../../util/db";

export type StoreCompanyFactsTaskInput = {
  facts: Factoid[];
};

export type StoreCompanyFactsTaskOutput = {
  success: boolean;
};

/**
 * Task for storing company facts
 */
export class StoreCompanyFactsTask extends Task<
  StoreCompanyFactsTaskInput,
  StoreCompanyFactsTaskOutput
> {
  static readonly type = "StoreCompanyFactsTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  static readonly inputs = [
    {
      id: "facts",
      name: "Facts",
      isArray: true,
      valueType: "object",
    },
  ];
  static readonly outputs = [
    {
      id: "success",
      name: "Success",
      valueType: "boolean",
    },
  ];

  async execute(
    input: StoreCompanyFactsTaskInput,
    config: IExecuteConfig
  ): Promise<StoreCompanyFactsTaskOutput> {
    const factsArray: Factoid[] = input.facts;
    if (!factsArray) return { success: false };

    const estimatedFacts = factsArray.length;
    let progress = 0;
    let index = 0;
    factsArray.forEach((fact) => {
      const cik = fact.cik;
      if (config.signal?.aborted) {
        throw new TaskAbortedError();
      }
      query_run(
        `INSERT INTO company_facts(cik,grouping,name,filed_date,form,units,frame,accession_number,start_date,end_date,val,fy,fp)
          VALUES($cik,$grouping,$name,$filed_date,$form,$units,$frame,$accession_number,$start_date,$end_date,$val,$fy,$fp)
          ON CONFLICT DO NOTHING`,
        {
          $cik: cik,
          $grouping: fact.grouping,
          $name: fact.name,
          $filed_date: fact.filed_date,
          $form: fact.form,
          $units: fact.units,
          $frame: fact.frame || null,
          $accession_number: fact.accession_number,
          $start_date: fact.start_date || null,
          $end_date: fact.end_date || null,
          $val: fact.val,
          $fy: fact.fy,
          $fp: fact.fp,
        }
      );
      const newProgress = Math.round((index++ / estimatedFacts) * 100);
      if (newProgress > progress) {
        // round numbers, so max 100 times
        config.updateProgress(newProgress, `cik: ${cik}`);
        progress = newProgress;
      }
    });
    return { success: true };
  }
}
