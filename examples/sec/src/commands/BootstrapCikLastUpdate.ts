//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runTasks } from "@ellmers/cli";
import { pipe } from "@ellmers/task-graph";
import type { Command } from "commander";
import { FetchQuarterlyIndexRangeTask } from "../task/index/FetchQuarterlyIndexRangeTask";
import { StoreCikLastUpdatedTask } from "../task/index/StoreCikLastUpdatedTask";
import { FetchQuarterlyIndexTask } from "../task/index/FetchQuarterlyIndexTask";

export function BootstrapCikLastUpdate(program: Command) {
  program
    .command("bootstrap-cik-last-update")
    .description("bootstrap the cik last update task")
    .argument("[year]", "the year to bootstrap the cik last update task")
    .action(async (year: string) => {
      const yearInt = year ? parseInt(year) : undefined;
      if (yearInt && (yearInt < 1993 || yearInt > new Date().getFullYear() + 1)) {
        throw new Error("Invalid year");
      }
      let flow;
      if (yearInt) {
        flow = pipe([
          new FetchQuarterlyIndexRangeTask({ startYear: yearInt }),
          new StoreCikLastUpdatedTask(),
        ]);
      } else {
        flow = pipe([new FetchQuarterlyIndexTask(), new StoreCikLastUpdatedTask()]);
      }
      try {
        await runTasks(flow);
      } catch (error) {
        console.error("Error running bootstrap cik last update task:", error);
      }
    });
}
