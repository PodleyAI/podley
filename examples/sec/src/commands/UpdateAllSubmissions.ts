//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { runTasks } from "@ellmers/cli";
import type { Command } from "commander";
import { UpdateAllSubmissionsTask } from "../task/submissions/UpdateAllSubmissionsTask";

export function UpdateAllSubmissions(program: Command) {
  program
    .command("update-all-submissions")
    .description("update all submissions for all companies")
    .action(async () => {
      const task = new UpdateAllSubmissionsTask();
      try {
        await runTasks(task);
      } catch (error) {
        console.error("Error fetching or storing submissions:", error);
      }
    });
}
