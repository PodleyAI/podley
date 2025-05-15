//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runWorkflow } from "@ellmers/cli";
import { Workflow } from "@ellmers/task-graph";
import type { Command } from "commander";
import { FetchCompanyFactsTask } from "../task/facts/FetchCompanyFactsTask";
import { StoreCompanyFactsTask } from "../task/facts/StoreCompanyFactsTask";
import { secDate } from "../util/parseDate";

export function CompanyFacts(program: Command) {
  program
    .command("company-facts")
    .description("get the company facts for a given date")
    .option("--date <date>", "date to get the company facts for")
    .argument("<cik>", "cik to get the company facts for")
    .action(async (cik: string, options) => {
      const workflow = new Workflow();
      workflow.pipe(
        new FetchCompanyFactsTask({
          date: options.date ? secDate(options.date) : undefined,
          cik: parseInt(cik),
        }),
        new StoreCompanyFactsTask()
      );
      try {
        await runWorkflow(workflow);
      } catch (error) {
        console.error("Error fetching or storing company facts:", error);
      }
    });
}
