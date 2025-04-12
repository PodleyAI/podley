//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Task, TaskGraph, IWorkflow, ITaskGraph } from "@ellmers/task-graph";
import React from "react";
import { render } from "tuir";
import App from "./components/App";
import { sleep } from "@ellmers/util";

export async function runWorkflow(workflow: IWorkflow) {
  runGraph(workflow.graph);
}

export async function runTask(task: Task) {
  const graph = new TaskGraph();
  graph.addTask(task);
  runGraph(graph);
}

export async function runGraph(graph: ITaskGraph) {
  if (process.stdout.isTTY) {
    await runTaskToInk(graph);
  } else {
    const result = await graph.run();
    console.log(JSON.stringify(result, null, 2));
  }
}

const runTaskToInk = async (graph: ITaskGraph) => {
  // preserveScreen();
  const { unmount } = render(React.createElement(App, { graph }));
  let results: any;
  try {
    await sleep(150);
    results = await graph.run();
  } catch (e: any) {}
  await sleep(150);
  unmount();
};
