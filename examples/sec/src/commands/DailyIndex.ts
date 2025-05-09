//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runTasks } from "@ellmers/cli";
import { pipe } from "@ellmers/task-graph";
import type { Command } from "commander";
import { FetchDailyIndexTask } from "../task/index/FetchDailyIndexTask";
import { StoreCikLastUpdatedTask } from "../task/index/StoreCikLastUpdatedTask";

export function AddDailyIndexCommands(program: Command) {
  program
    .command("daily-index")
    .description("get the daily index for a given date")
    .argument("[date]", "date to get the daily index for")
    .action(async (date: string) => {
      const flow = pipe([new FetchDailyIndexTask({ date }), new StoreCikLastUpdatedTask()]);
      try {
        await runTasks(flow);
      } catch (error) {
        console.error("Error running daily index task:", error);
      }
    });
}
