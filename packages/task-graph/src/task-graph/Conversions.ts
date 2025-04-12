//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { GraphAsTask } from "../task/GraphAsTask";
import type { IExecuteConfig, ITask } from "../task/ITask";
import { Task } from "../task/Task";
import type { TaskInput, TaskOutput } from "../task/TaskTypes";
import { Dataflow } from "./Dataflow";
import { ITaskGraph } from "./ITaskGraph";
import { Workflow } from "./Workflow";
import type { IWorkflow } from "./IWorkflow";
import { TaskGraph } from "./TaskGraph";
import { CompoundMergeStrategy } from "./TaskGraphRunner";

// Update PipeFunction type to be more specific about input/output types
export type PipeFunction<I extends TaskInput = any, O extends TaskOutput = any> = (
  input: I,
  config: IExecuteConfig
) => O | Promise<O>;

function convertPipeFunctionToTask<I extends TaskInput, O extends TaskOutput>(
  fn: PipeFunction<I, O>,
  config?: any
): ITask<I, O> {
  class QuickTask extends Task<I, O> {
    public static type = fn.name ? `𝑓 ${fn.name}` : "𝑓";
    public static inputs = [{ id: "*", name: "input", valueType: "any" }];
    public static outputs = [{ id: "*", name: "output", valueType: "any" }];
    public static cacheable = false;
    public async execute(input: I, config: IExecuteConfig) {
      return fn(input, config);
    }
  }
  return new QuickTask({}, config);
}

export function ensureTask<I extends TaskInput, O extends TaskOutput>(
  arg: IWorkflow<I, O> | PipeFunction<I, O> | ITask<any, any, any> | ITaskGraph,
  config?: any
): ITask<any, any, any> {
  if (arg instanceof Task) {
    return arg;
  }
  if (arg instanceof TaskGraph) {
    return new GraphAsTask({}, { subGraph: arg });
  }
  if (arg instanceof Workflow) {
    return new GraphAsTask({}, { subGraph: arg.graph });
  }
  return convertPipeFunctionToTask(arg as PipeFunction<I, O>, config);
}

export function getLastTask(workflow: IWorkflow): ITask<any, any, any> | undefined {
  const tasks = workflow.graph.getTasks();
  return tasks.length > 0 ? tasks[tasks.length - 1] : undefined;
}

export function connect(
  source: ITask<any, any, any>,
  target: ITask<any, any, any>,
  workflow: IWorkflow<any, any>
): void {
  workflow.graph.addDataflow(new Dataflow(source.config.id, "*", target.config.id, "*"));
}

export function pipe<T extends TaskInput = any, O extends TaskOutput = TaskOutput>(
  args: (IWorkflow<T, O> | PipeFunction<T, O> | ITask<T, O, any>)[],
  workflow: IWorkflow<T, O>
): IWorkflow<T, O> {
  let previousTask = getLastTask(workflow);
  const tasks = args.map((arg) => ensureTask(arg));
  tasks.forEach((task) => {
    workflow.graph.addTask(task);
    if (previousTask) {
      connect(previousTask, task, workflow);
    }
    previousTask = task;
  });
  return workflow;
}

export function parallel(
  args: (PipeFunction<any, any> | ITask<any, any, any> | IWorkflow<any, any> | ITaskGraph)[],
  mergeFn: CompoundMergeStrategy = "last-or-property-array",
  workflow: IWorkflow = new Workflow()
): IWorkflow {
  let previousTask = getLastTask(workflow);
  const tasks = args.map((arg) => ensureTask(arg));
  const input = {};
  const config = {
    compoundMerge: mergeFn,
  };
  const mergeTask = new GraphAsTask(input, config);
  mergeTask.subGraph!.addTasks(tasks);
  workflow.graph.addTask(mergeTask);
  if (previousTask) {
    connect(previousTask, mergeTask, workflow);
  }
  return workflow;
}
