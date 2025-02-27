//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraph, TaskGraphRunner } from "@ellmers/task-graph";
import React from "react";
import { render } from "ink";
import App from "./components/App";
import { preserveScreen } from "tuir";
import { sleep } from "@ellmers/util";

export async function runTask(dag: TaskGraph) {
  const runner = new TaskGraphRunner(dag);
  if (process.stdout.isTTY) {
    await runTaskToInk(runner);
  } else {
    const result = await runner.runGraph();
    console.log(JSON.stringify(result, null, 2));
  }
}

const runTaskToInk = async (runner: TaskGraphRunner) => {
  // preserveScreen();
  const { unmount } = render(React.createElement(App, { runner }));
  try {
    await sleep(1);
    await runner.runGraph();
  } catch (e: any) {
    console.error(e.errors[0].error);
  } finally {
    unmount();
  }
};
