//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { IExecuteConfig, Task, TaskAbortedError } from "@ellmers/task-graph";
import { Static, TObject, Type } from "@sinclair/typebox";
import { SecCachedFetchTask } from "../../fetch/SecCachedFetchTask";
import { CompanyFacts, Factoid, FactoidSchema } from "../../types/CompanyFacts";
import { TypeSecCik } from "../../types/CompanySubmission";
import { secDate, TypeOptionalSecDate } from "../../util/parseDate";

// NOTE: company facts are mutable, so we need to pass in a date to break the cache

const inputSchema = () =>
  Type.Object({
    cik: TypeSecCik(),
    date: TypeOptionalSecDate(),
  });

export type FetchCompanyFactsTaskInput = Static<ReturnType<typeof inputSchema>>;

const outputSchema = () =>
  Type.Object({
    facts: Type.Array(FactoidSchema),
  });
export type FetchCompanyFactsTaskOutput = Static<ReturnType<typeof outputSchema>>;

class SecFetchCompanyFactsTask extends SecCachedFetchTask<FetchCompanyFactsTaskInput> {
  static readonly type = "SecFetchCompanyFactsTask";
  static readonly category = "Hidden";
  static readonly immutable = false;

  public static inputSchema(): TObject {
    return inputSchema();
  }

  inputToFileName(input: FetchCompanyFactsTaskInput): string {
    return `companyfacts/CIK${input.cik.toString().padStart(10, "0")}.json`;
  }
  inputToUrl(input: FetchCompanyFactsTaskInput): string {
    const date = input.date ? secDate(input.date) : undefined;
    return `https://data.sec.gov/api/xbrl/companyfacts/CIK${input.cik.toString().padStart(10, "0")}.json${date ? `?date=${date}` : ""}`;
  }
}

/**
 * Task for fetching the daily index of SEC filings and parsing it into a list of CIKs to update
 */
export class FetchCompanyFactsTask extends Task<
  FetchCompanyFactsTaskInput,
  FetchCompanyFactsTaskOutput
> {
  static readonly type = "FetchCompanyFactsTask";
  static readonly category = "SEC";
  static readonly cacheable = true;

  public static inputSchema(): TObject {
    return inputSchema();
  }

  public static outputSchema(): TObject {
    return outputSchema();
  }

  async execute(
    input: FetchCompanyFactsTaskInput,
    config: IExecuteConfig
  ): Promise<FetchCompanyFactsTaskOutput> {
    const cik = input.cik;
    if (!cik) return { facts: [] };

    const secFetch = config.own(new SecFetchCompanyFactsTask(input));
    const secData = await secFetch.run();
    const companyFacts = secData.json! as unknown as CompanyFacts;
    const facts = companyFacts.facts;
    // linearize the facts

    const factsArray: Factoid[] = [];
    Object.entries(facts).forEach(([grouping, names]) => {
      Object.entries(names).forEach(([name, info]) => {
        Object.entries(info.units).forEach(([unit, summaries]) => {
          for (const summary of summaries) {
            if (config.signal?.aborted) {
              throw new TaskAbortedError();
            }
            factsArray.push({
              cik,
              grouping,
              name,
              filed_date: summary.filed,
              form: summary.form,
              val_unit: unit,
              frame: summary.frame || null,
              accession_number: summary.accn,
              start_date: summary.start || null,
              end_date: summary.end,
              val: summary.val,
              fy: summary.fy,
              fp: summary.fp,
            });
          }
        });
      });
    });
    return { facts: factsArray };
  }
}
