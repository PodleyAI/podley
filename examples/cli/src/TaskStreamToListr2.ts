//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Listr, ListrTask, PRESET_TIMER } from "listr2";
import { Observable } from "rxjs";
import {
  TaskStatus,
  TaskGraph,
  TaskGraphRunner,
  type Task,
  CompoundTask,
} from "@ellmers/task-graph";
import { sleep } from "@ellmers/util";
import { createBar } from "./TaskHelper";
import { DownloadModelTask } from "@ellmers/ai";

const options = {
  exitOnError: true,
  concurrent: true,
  rendererOptions: { timer: PRESET_TIMER },
};

const runTaskToListr = async (runner: TaskGraphRunner) => {
  const listrTasks = mapTaskGraphToListrTasks(runner);
  const listr = new Listr(listrTasks, options);

  listr.run({});
  await sleep(50);
  const result = await runner.runGraph();
  await sleep(50);
  console.log("Result", result);
};

export async function runTask(dag: TaskGraph) {
  const runner = new TaskGraphRunner(dag);
  if (process.stdout.isTTY) {
    await runTaskToListr(runner);
  } else {
    const result = await runner.runGraph();
    console.log(JSON.stringify(result, null, 2));
  }
}

export function mapTaskGraphToListrTasks(runner: TaskGraphRunner): ListrTask[] {
  const sortedNodes = runner.dag.topologicallySortedNodes();
  const rootNodes = sortedNodes.filter(
    (task: Task) => runner.dag.getSourceTasks(task.config.id).length === 0
  );
  const listrTasks = rootNodes.map((task: Task) => {
    return mapTaskNodeToListrTask(task, runner) ?? [];
  });
  return listrTasks?.flat() ?? [];
}

function mapCompoundTaskNodeToListrTask(
  task: CompoundTask,
  parentRunner: TaskGraphRunner
): ListrTask {
  return {
    title: task.config.name,
    task: (ctx, t) => {
      const runner = new TaskGraphRunner(task.subGraph, parentRunner.repository);
      const listTasks = t.newListr(mapTaskGraphToListrTasks(runner), options);
      return listTasks;
    },
  };
}

function mapSimpleTaskNodeToListrTask(task: Task): ListrTask {
  return {
    title: task.config.name,
    task: async (ctx, t) => {
      if (task.status == TaskStatus.COMPLETED || task.status == TaskStatus.FAILED) return;
      return new Observable((observer) => {
        const start = Date.now();
        let lastUpdate = start;
        task.on(
          "progress",
          // @ts-ignore
          (
            progress: number,
            message: string,
            details = {
              file: "",
              text: "",
              progress: 0,
            }
          ) => {
            const timeSinceLast = Date.now() - lastUpdate;
            const timeSinceStart = Date.now() - start;
            let msg = "";
            if (message === "Downloading model") {
              const dl = task as DownloadModelTask;
              const files = dl.files;
              const file = files.find((f) => f.file === details.file);
              if (file) {
                file.progress = details.progress;
              } else {
                files.push({ file: details.file, progress: details.progress });
              }
              const progress = files.reduce((acc, f) => acc + f.progress, 0) / files.length;
              msg = createBar(progress / 100 || 0, 30);
              msg +=
                "\n" +
                files
                  .map((f) => createBar(f.progress / 100 || 0, 30) + " " + (f.file || ""))
                  .join("\n");
            } else {
              msg = createBar(progress / 100 || 0, 30);
            }
            if (timeSinceLast > 250 || timeSinceStart > 100) {
              observer.next(msg);
              if (timeSinceStart > 1000) {
                console.error("=======\n\n" + msg + "\n\n=======", task);
                process.exit(0);
              }
            }
          }
        );
        task.on("complete", () => {
          observer.complete();
        });
        task.on("error", () => {
          observer.complete();
        });
      });
    },
  };
}

function mapTaskNodeToListrTask(node: Task, runner: TaskGraphRunner): ListrTask {
  const deps = getDependentTasks(node, runner);
  let parent: ListrTask;
  if (node.isCompound) {
    parent = mapCompoundTaskNodeToListrTask(node, runner);
  } else {
    parent = mapSimpleTaskNodeToListrTask(node);
  }
  if (deps.length == 0) {
    return parent;
  } else {
    return {
      title: node.config.name + "Group",
      task: (ctx, t) => {
        const listTasks = t.newListr([parent, ...deps], { ...options, concurrent: false });
        return listTasks;
      },
    };
  }
}

export function getDependentTasks(task: Task, runner: TaskGraphRunner): ListrTask[] {
  const graph: TaskGraph = runner.dag;
  return graph
    .getTargetTasks(task.config.id)
    .map((targetTask) => mapTaskNodeToListrTask(targetTask, runner));
}
