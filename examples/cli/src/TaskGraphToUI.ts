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
  // Render the Ink app
  const { unmount } = render(React.createElement(App, { runner }));
  await runner.runGraph();
  unmount();
};
