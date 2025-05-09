//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runWorkflow } from "@ellmers/cli";
import type { Command } from "commander";
import { FetchAllCikNamesTask } from "../task/ciknames/FetchAllCikNamesTask";
import { pipe } from "@ellmers/task-graph";
import { StoreCikNamesTask } from "../task/ciknames/StoreCikNamesTask";

export function BootstrapAllCikNames(program: Command) {
  program
    .command("bootstrap-all-cik-names")
    .description("bootstrap the all cik names task")
    .action(async () => {
      const wf = pipe([new FetchAllCikNamesTask(), new StoreCikNamesTask()]);
      try {
        await runWorkflow(wf);
      } catch (error) {
        console.error("Error running bootstrap all cik names task:", error);
      }
    });
}
