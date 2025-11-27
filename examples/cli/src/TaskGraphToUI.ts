/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { ITaskGraph, IWorkflow, Task, TaskGraph, Taskish, Workflow } from "@workglow/task-graph";
import { sleep } from "@workglow/util";
import React from "react";
import { render } from "retuink";
import App from "./components/App";

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

export async function runSingleTask(task: Task): Promise<void> {
  if (process.stdout.isTTY === true || (process.stdout.isTTY === undefined && !process.env.CI)) {
    const graph = new TaskGraph();
    graph.addTask(task);
    await runTaskGraphToInk(graph);
  } else {
    const result = await task.run();
    console.log(JSON.stringify(result, null, 2));
  }
}

export async function runGraph(graph: ITaskGraph): Promise<void> {
  if (process.stdout.isTTY === true || (process.stdout.isTTY === undefined && !process.env.CI)) {
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
    await sleep(150);
    results = await graph.run();
  } catch (e: any) {}
  await sleep(150);
  unmount();
};
