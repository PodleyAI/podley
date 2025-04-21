//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Task, TaskGraph, IWorkflow, ITaskGraph, Taskish, Workflow } from "@ellmers/task-graph";
import React from "react";
import { render } from "retuink";
import App from "./components/App";
import { sleep } from "@ellmers/util";

export async function runTasks(taskish: Taskish) {
  if (taskish instanceof Workflow) {
    await runWorkflow(taskish);
  } else if (taskish instanceof Task) {
    await runSingleTask(taskish);
  } else if (taskish instanceof TaskGraph) {
    await runGraph(taskish);
  } else {
    throw new Error("Unknown taskish type");
  }
}

export async function runWorkflow(workflow: IWorkflow) {
  await runGraph(workflow.graph);
}

export async function runSingleTask(task: Task) {
  if (process.stdout.isTTY) {
    const graph = new TaskGraph();
    graph.addTask(task);
    await runTaskGraphToInk(graph);
  } else {
    const result = await task.run();
    console.log(JSON.stringify(result, null, 2));
  }
}

export async function runGraph(graph: ITaskGraph) {
  if (process.stdout.isTTY) {
    await runTaskGraphToInk(graph);
  } else {
    const result = await graph.run();
    console.log(JSON.stringify(result, null, 2));
  }
}

const runTaskGraphToInk = async (graph: ITaskGraph) => {
  // preserveScreen();
  const { unmount } = render(React.createElement(App, { graph }), {
    throttle: 50,
  });
  let results: any;
  try {
    await sleep(50);
    results = await graph.run();
  } catch (e: any) {}
  await sleep(150);
  unmount();
};
