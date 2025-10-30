//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { NamedGraphResult } from "../task-graph/TaskGraphRunner";
import { TaskRunner } from "./TaskRunner";
import { TaskConfig, TaskInput, TaskOutput } from "./TaskTypes";
import { GraphAsTask } from "./GraphAsTask";

export class GraphAsTaskRunner<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends TaskRunner<Input, Output, Config> {
  declare task: GraphAsTask<Input, Output, Config>;

  /**
   * Protected method to execute a task subgraphby delegating back to the task itself.
   */
  protected async executeTaskChildren(input: Input): Promise<NamedGraphResult<Output>> {
    const unsubscribe = this.task.subGraph!.subscribe(
      "graph_progress",
      (progress: number, message?: string, ...args: any[]) => {
        this.task.emit("progress", progress, message, ...args);
      }
    );
    const results = await this.task.subGraph!.run<Output>(
      input,
      {
        parentProvenance: this.nodeProvenance || {},
        parentSignal: this.abortController?.signal,
        outputCache: this.outputCache,
      }
    );
    unsubscribe();
    return results;
  }
  /**
   * Protected method for reactive execution delegation
   * 
   * Note: Reactive execution doesn't accept input parameters by design.
   * It works with the graph's internal state and dataflow connections.
   * Tasks in the subgraph will use their existing runInputData (from defaults
   * or previous execution) combined with dataflow connections.
   */
  protected async executeTaskChildrenReactive(): Promise<NamedGraphResult<Output>> {
    return this.task.subGraph!.runReactive<Output>();
  }

  protected async handleSkip(): Promise<void> {
    if (this.task.hasChildren()) {
      await this.task.subGraph!.skip();
    }
    super.handleSkip();
  }

  // ========================================================================
  // Utility methods
  // ========================================================================

  private fixInput(input: Input): Input {
    // inputs has turned each property into an array, so we need to flatten the input
    const flattenedInput = Object.entries(input).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        return { ...acc, [key]: value[0] };
      }
      return { ...acc, [key]: value };
    }, {});
    return flattenedInput as Input;
  }

  // ========================================================================
  // TaskRunner method overrides and helpers
  // ========================================================================

  /**
   * Execute the task
   */
  protected async executeTask(input: Input): Promise<Output | undefined> {
    if (this.task.hasChildren()) {
      const runExecuteOutputData = await this.executeTaskChildren(input);
      this.task.runOutputData = this.task.subGraph.mergeExecuteOutputsToRunOutput(
        runExecuteOutputData,
        this.task.compoundMerge
      );
    } else {
      const result = await super.executeTask(this.fixInput(input));
      this.task.runOutputData = result ?? ({} as Output);
    }
    return this.task.runOutputData as Output;
  }

  /**
   * Execute the task reactively
   */
  public async executeTaskReactive(input: Input, output: Output): Promise<Output> {
    if (this.task.hasChildren()) {
      const reactiveResults = await this.executeTaskChildrenReactive();
      this.task.runOutputData = this.task.subGraph.mergeExecuteOutputsToRunOutput(
        reactiveResults,
        this.task.compoundMerge
      );
    } else {
      const reactiveResults = await super.executeTaskReactive(this.fixInput(input), output);
      this.task.runOutputData = reactiveResults ?? output ?? ({} as Output);
    }
    return this.task.runOutputData as Output;
  }
}
