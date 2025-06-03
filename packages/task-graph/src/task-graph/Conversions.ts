//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Type } from "@sinclair/typebox";
import { GraphAsTask } from "../task/GraphAsTask";
import type { IExecuteContext, ITask } from "../task/ITask";
import { Task } from "../task/Task";
import type { TaskIO } from "../task/TaskTypes";
import { Dataflow, DATAFLOW_ALL_PORTS } from "./Dataflow";
import type { ITaskGraph } from "./ITaskGraph";
import type { IWorkflow } from "./IWorkflow";
import { TaskGraph } from "./TaskGraph";
import type { CompoundMergeStrategy } from "./TaskGraphRunner";
import { Workflow } from "./Workflow";

class ListeningGraphAsTask extends GraphAsTask<any, any> {
  constructor(input: any, config: any) {
    super(input, config);
    this.subGraph.on("start", () => {
      this.emit("start");
    });
    this.subGraph.on("complete", () => {
      this.emit("complete");
    });
    this.subGraph.on("error", (e) => {
      this.emit("error", e);
    });
  }
}

class OwnGraphTask extends ListeningGraphAsTask {
  public static readonly type = "Own[Graph]";
}

class OwnWorkflowTask extends ListeningGraphAsTask {
  public static readonly type = "Own[Workflow]";
}
class GraphTask extends GraphAsTask {
  public static readonly type = "Graph";
}

class WorkflowTask extends GraphAsTask {
  public static readonly type = "Workflow";
}

// Update PipeFunction type to be more specific about input/output types
export type PipeFunction<I extends TaskIO = any, O extends TaskIO = any> = (
  input: I,
  context: IExecuteContext
) => O | Promise<O>;

export type Taskish<A extends TaskIO = TaskIO, B extends TaskIO = TaskIO> =
  | PipeFunction<A, B>
  | ITask<A, B>
  | ITaskGraph
  | IWorkflow<A, B>;

function convertPipeFunctionToTask<I extends TaskIO, O extends TaskIO>(
  fn: PipeFunction<I, O>,
  config?: any
): ITask<I, O> {
  class QuickTask extends Task<I, O> {
    public static type = fn.name ? `𝑓 ${fn.name}` : "𝑓";
    public static inputSchema = () => {
      return Type.Object({
        [DATAFLOW_ALL_PORTS]: Type.Any(),
      });
    };
    public static outputSchema = () => {
      return Type.Object({
        [DATAFLOW_ALL_PORTS]: Type.Any(),
      });
    };
    public static cacheable = false;
    public async execute(input: I, context: IExecuteContext) {
      return fn(input, context);
    }
  }
  return new QuickTask({}, config);
}

export function ensureTask<I extends TaskIO, O extends TaskIO>(
  arg: Taskish<I, O>,
  config: any = {}
): ITask<any, any, any> {
  if (arg instanceof Task) {
    return arg;
  }
  if (arg instanceof TaskGraph) {
    if (config.isOwned) {
      return new OwnGraphTask({}, { ...config, subGraph: arg });
    } else {
      return new GraphTask({}, { ...config, subGraph: arg });
    }
  }
  if (arg instanceof Workflow) {
    if (config.isOwned) {
      return new OwnWorkflowTask({}, { ...config, subGraph: arg.graph });
    } else {
      return new WorkflowTask({}, { ...config, subGraph: arg.graph });
    }
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

export function pipe<A extends TaskIO, B extends TaskIO>(
  [fn1]: [Taskish<A, B>],
  workflow?: IWorkflow<A, B>
): IWorkflow<A, B>;

export function pipe<A extends TaskIO, B extends TaskIO, C extends TaskIO>(
  [fn1, fn2]: [Taskish<A, B>, Taskish<B, C>],
  workflow?: IWorkflow<A, C>
): IWorkflow<A, C>;

export function pipe<A extends TaskIO, B extends TaskIO, C extends TaskIO, D extends TaskIO>(
  [fn1, fn2, fn3]: [Taskish<A, B>, Taskish<B, C>, Taskish<C, D>],
  workflow?: IWorkflow<A, D>
): IWorkflow<A, D>;

export function pipe<
  A extends TaskIO,
  B extends TaskIO,
  C extends TaskIO,
  D extends TaskIO,
  E extends TaskIO,
>(
  [fn1, fn2, fn3, fn4]: [Taskish<A, B>, Taskish<B, C>, Taskish<C, D>, Taskish<D, E>],
  workflow?: IWorkflow<A, E>
): IWorkflow<A, E>;

export function pipe<
  A extends TaskIO,
  B extends TaskIO,
  C extends TaskIO,
  D extends TaskIO,
  E extends TaskIO,
  F extends TaskIO,
>(
  [fn1, fn2, fn3, fn4, fn5]: [
    Taskish<A, B>,
    Taskish<B, C>,
    Taskish<C, D>,
    Taskish<D, E>,
    Taskish<E, F>,
  ],
  workflow?: IWorkflow<A, F>
): IWorkflow<A, F>;

export function pipe<T extends TaskIO = any, O extends TaskIO = TaskIO>(
  args: Taskish<T, O>[],
  workflow: IWorkflow<T, O> = new Workflow()
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
  const name = `‖${args.map((arg) => "𝑓").join("‖")}‖`;
  class ParallelTask extends GraphAsTask<any, any> {
    public static type = name;
  }
  const mergeTask = new ParallelTask(input, config);
  mergeTask.subGraph!.addTasks(tasks);
  workflow.graph.addTask(mergeTask);
  if (previousTask) {
    connect(previousTask, mergeTask, workflow);
  }
  return workflow;
}
