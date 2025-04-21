//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Workflow } from "@ellmers/task-graph";
import type { Command } from "commander";
import { FetchCompanySubmissionsTask } from "../task/FetchCompanySubmissionsTask";
import { StoreCompanySubmissionsTask } from "../task/StoreCompanySubmissionsTask";
import { runWorkflow } from "@ellmers/cli";

export function CompanySubmissions(program: Command) {
  program
    .command("company-submissions")
    .description("get the company submissions for a given date")
    .option("--date <date>", "cache buster")
    .argument("<cik>", "cik to get the company submissions for")
    .action(async (cik: string, options) => {
      const wf = new Workflow();
      wf.pipe(
        new FetchCompanySubmissionsTask({
          date: options.date,
          cik: parseInt(cik),
        }),
        new StoreCompanySubmissionsTask()
      );
      try {
        await runWorkflow(wf);
      } catch (error) {
        console.error("Error running daily index task:", error);
      }
    });
}
