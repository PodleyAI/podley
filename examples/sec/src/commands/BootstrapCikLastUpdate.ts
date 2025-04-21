//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runTasks } from "@ellmers/cli";
import type { Command } from "commander";
import { MasterIndexAggregateLastDateTask } from "../task/MasterIndexAggregateLastDateTask";

export function BootstrapCikLastUpdate(program: Command) {
  program
    .command("bootstrap-cik-last-update")
    .description("bootstrap the cik last update task")
    .argument("<file_name>", "the file name of the master index last date task")
    .action(async (file_name: string) => {
      const task = new MasterIndexAggregateLastDateTask({ file_name });
      try {
        await runTasks(task);
      } catch (error) {
        console.error("Error running bootstrap cik last update task:", error);
      }
    });
}
