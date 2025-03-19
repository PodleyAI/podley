//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraph, TaskGraphRunner } from "@ellmers/task-graph";
import React from "react";
import { render } from "tuir";
import App from "./components/App";
import { sleep } from "@ellmers/util";

export async function runTask(graph: TaskGraph) {
  if (process.stdout.isTTY) {
    await runTaskToInk(graph);
  } else {
    const result = await graph.run();
    console.log(JSON.stringify(result, null, 2));
  }
}

const runTaskToInk = async (graph: TaskGraph) => {
  // preserveScreen();
  const { unmount } = render(React.createElement(App, { graph }));
  let results: any;
  try {
    await sleep(50);
    results = await graph.run();
  } catch (e: any) {}
  await sleep(150);
  unmount();
};
