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
  TaskInput,
  Workflow,
  parallel,
} from "@ellmers/task-graph";
import { objectOfArraysAsArrayOfObjects, sleep } from "@ellmers/util";
import {
  insertAddress,
  insertPhone,
  processCikName,
  todayYYYYdMMdDD,
} from "../util/commonStoreSec";
import { cleanEin } from "../util/dataCleaningUtils";
import { query_run } from "../util/db";
import {
  FetchCompanySubmissionsOutput,
  FetchCompanySubmissionsTask,
} from "./FetchCompanySubmissionsTask";
import { Filings } from "../types/FilingMetaData";

export type StoreCompanySubmissionsTaskInput = FetchCompanySubmissionsOutput;

export type StoreCompanySubmissionsTaskOutput = {
  success: boolean;
};

/**
 * Task for storing company facts
 */
export class StoreCompanySubmissionsTask extends Task<
  StoreCompanySubmissionsTaskInput,
  StoreCompanySubmissionsTaskOutput
> {
  static readonly type = "StoreCompanySubmissionsTask";
  static readonly category = "SEC";
  static readonly cacheable = false;

  static readonly inputs = FetchCompanySubmissionsTask.outputs;
  static readonly outputs = [
    {
      id: "success",
      name: "Success",
      valueType: "boolean",
    },
  ];

  async execute(
    input: StoreCompanySubmissionsTaskInput,
    config: IExecuteConfig
  ): Promise<StoreCompanySubmissionsTaskOutput> {
    let { submission } = input;
    if (Array.isArray(submission)) {
      submission = submission[0];
    }
    if (!submission) return { success: false };
    const cik = parseInt(submission.cik);
    const name = submission.name;

    function processSubmissionCikName() {
      processCikName(cik, name);
    }

    function processSubmissionSic() {
      const { sic, sicDescription } = submission;
      if (sic && sicDescription) {
        query_run(
          `INSERT INTO sic(sic,description)
            VALUES($sic,$description)
            ON CONFLICT DO NOTHING`,
          {
            $sic: sic,
            $description: sicDescription,
          }
        );
      }
    }

    function processSubmissionEntity() {
      query_run(
        `INSERT OR REPLACE INTO entities(cik,name,type,sic,ein,description,website,investor_website,category,fiscal_year,state_incorporation,state_incorporation_desc)
          VALUES($cik,$name,$type,$sic,$ein,$description,$website,$investor_website,$category,$fiscal_year,$state_incorporation,$state_incorporation_desc)`,
        {
          $cik: cik,
          $name: name,
          $type: submission.entityType,
          $sic: submission.sic || null,
          $ein: cleanEin(submission.ein || ""),
          $description: submission.description || null,
          $website: submission.website || null,
          $investor_website: submission.investorWebsite || null,
          $category: submission.category || null,
          $fiscal_year: submission.fiscalYearEnd || null,
          $state_incorporation: submission.stateOfIncorporation || null,
          $state_incorporation_desc: submission.stateOfIncorporationDescription || null,
        }
      );
    }

    function processSubmissionPhone() {
      insertPhone(submission.phone, "entity:contact", cik);
    }

    function processSubmissionAddresses() {
      for (const [kind, address] of Object.entries(submission.addresses)) {
        insertAddress(address, "entity:" + kind, cik);
      }
    }

    function processSubmissionTickers() {
      const { tickers, exchanges } = submission;
      if (tickers && exchanges) {
        for (const i in tickers) {
          const ticker = tickers[i];
          const exchange = exchanges[i];
          query_run(
            `INSERT OR REPLACE INTO entity_tickers(cik,ticker,exchange)
              VALUES($cik,$ticker,$exchange)
              ON CONFLICT DO NOTHING`,
            {
              $cik: cik,
              $ticker: ticker,
              $exchange: exchange || "",
            }
          );
        }
      }
    }

    async function processSubmissionFilings(ti: TaskInput, config: IExecuteConfig) {
      let filings_array: Filings;
      if (Array.isArray(input.filings)) {
        filings_array = input.filings[0];
        for (let i = 1; i < input.filings.length; i++) {
          const filing = input.filings[i];
          // for each property, if it's an array, merge the arrays
          for (const key of Object.keys(filing)) {
            // @ts-ignore
            filings_array[key] = filings_array[key].concat(filing[key]);
          }
        }
      } else {
        filings_array = input.filings;
      }
      const filings = objectOfArraysAsArrayOfObjects(filings_array);
      let index = 0;
      let progress = 0;
      for (const filing of filings) {
        if (config.signal.aborted) {
          throw new TaskAbortedError();
        }
        const newProgress = Math.round((index++ / filings.length) * 10) * 10; // much faster than if we give up time for ui
        if (newProgress > progress) {
          config.updateProgress(newProgress);
          progress = newProgress;
          await sleep(0);
        }
        query_run(
          `INSERT OR REPLACE INTO filings(cik,accession_number,filing_date,report_date,acceptance_date,form,file_number,film_number,primary_doc,primary_doc_description,size,is_xbrl,is_inline_xbrl,items,act) 
            VALUES ($cik,$accession_number,$filing_date,$report_date,$acceptance_date,$form,$file_number,$film_number,$primary_doc,$primary_doc_description,$size,$is_xbrl,$is_inline_xbrl,$items,$act)`,
          {
            $cik: cik,
            $accession_number: filing.accessionNumber,
            $filing_date: filing.filingDate,
            $report_date: filing.reportDate,
            $acceptance_date: filing.acceptanceDateTime,
            $form: filing.form,
            $file_number: filing.fileNumber,
            $film_number: filing.filmNumber,
            $primary_doc: filing.primaryDocument,
            $primary_doc_description: filing.primaryDocDescription,
            $size: filing.size,
            $is_xbrl: filing.isXBRL === "1",
            $is_inline_xbrl: filing.isInlineXBRL === "1",
            $items: filing.items,
            $act: filing.act,
          }
        );
      }
    }

    function processUpdateProcessing() {
      query_run(
        `INSERT OR REPLACE INTO processed_submissions(cik,last_processed)
          VALUES($cik,$last_processed)`,
        {
          $cik: cik,
          $last_processed: todayYYYYdMMdDD(),
        }
      );
      return { success: true };
    }

    const workflow = config.own(new Workflow());
    workflow.pipe(
      parallel([
        processSubmissionCikName,
        processSubmissionSic,
        processSubmissionEntity,
        processSubmissionPhone,
        processSubmissionAddresses,
        processSubmissionTickers,
        processSubmissionFilings,
      ]),
      processUpdateProcessing
    );
    await workflow.run();

    return { success: true };
  }
}
