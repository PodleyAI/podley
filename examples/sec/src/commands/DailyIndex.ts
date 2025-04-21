//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { Command } from "commander";
import { runTasks } from "@ellmers/cli";
import { FetchDailyIndexTask } from "../task/FetchDailyIndexTask";

export function AddDailyIndexCommands(program: Command) {
  program
    .command("daily-index")
    .description("get the daily index for a given date")
    .argument("<date>", "date to get the daily index for")
    .option("--limit <number>", "limit the number of records to return")
    .action(async (date: string, options) => {
      const task = new FetchDailyIndexTask({ date, limit: options.limit });
      try {
        await runTasks(task);
      } catch (error) {
        console.error("Error running daily index task:", error);
      }
    });
}
