//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runTasks } from "@ellmers/cli";
import type { Command } from "commander";
import { UpdateAllCompanyFactsTask } from "../task/facts/UpdateAllCompanyFactsTask";

export function UpdateAllCompanyFacts(program: Command) {
  program
    .command("update-all-company-facts")
    .description("update all facts for all companies")
    .action(async () => {
      const task = new UpdateAllCompanyFactsTask();
      try {
        await runTasks(task);
      } catch (error) {
        console.error("Error fetching or storing company facts:", error);
      }
    });
}
