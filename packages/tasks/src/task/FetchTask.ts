//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  TaskGraphBuilder,
  TaskGraphBuilderHelper,
  TaskRegistry,
  SingleTask,
  TaskStatus,
} from "@ellmers/task-graph";

export type url = string;
export type FetchTaskInput = {
  url: url;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string;
  response_type?: "json" | "text" | "blob" | "arraybuffer";
};
export type FetchTaskOutput = {
  output: any;
};

/**
 * FetchTask provides a task for fetching data from a URL.
 */
export class FetchTask extends SingleTask {
  static readonly type: string = "FetchTask";
  static readonly category = "Output";
  declare runInputData: FetchTaskInput;
  declare runOutputData: FetchTaskOutput;
  private abortController: AbortController | undefined;
  public static inputs = [
    {
      id: "url",
      name: "URL",
      valueType: "url",
    },
    {
      id: "method",
      name: "Method",
      valueType: "method",
      optional: true,
      defaultValue: "GET",
    },
    {
      id: "headers",
      name: "Headers",
      valueType: "record_string_string",
      optional: true,
    },
    {
      id: "body",
      name: "Body",
      valueType: "string",
      optional: true,
    },
    {
      id: "response_type",
      name: "Response Type",
      valueType: "response_type",
      optional: true,
      defaultValue: "json",
    },
  ] as const;
  public static outputs = [{ id: "output", name: "Output", valueType: "any" }] as const;
  async run(): Promise<FetchTaskOutput> {
    this.handleStart();

    try {
      if (!(await this.validateInputData(this.runInputData))) {
        throw new Error("Invalid input data");
      }
      if (this.status === TaskStatus.ABORTING) {
        throw new Error("Task aborted by run time");
      }
      this.abortController = new AbortController();
      const response = await fetch(this.runInputData.url, {
        method: this.runInputData.method,
        headers: this.runInputData.headers,
        body: this.runInputData.body,
        signal: this.abortController.signal,
      });

      if (this.runInputData.response_type === "json") {
        this.runOutputData.output = await response.json();
      } else if (this.runInputData.response_type === "text") {
        this.runOutputData.output = await response.text();
      } else if (this.runInputData.response_type === "blob") {
        this.runOutputData.output = await response.blob();
      } else if (this.runInputData.response_type === "arraybuffer") {
        this.runOutputData.output = await response.arrayBuffer();
      }

      this.runOutputData = await this.runReactive();

      this.handleComplete();
      return this.runOutputData;
    } catch (err: any) {
      this.handleError(err);
      throw err;
    } finally {
      // Clean up the abort controller
      this.abortController = undefined;
    }
  }

  public async abort() {
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
    }
    await super.abort();
  }

  async runReactive(): Promise<FetchTaskOutput> {
    return this.runOutputData ?? {};
  }

  async validateItem(valueType: string, item: any) {
    if (valueType === "url") {
      try {
        new URL(item);
        return true;
      } catch (err) {
        return false;
      }
    }
    if (valueType === "method") {
      return ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(item);
    }
    if (valueType === "response_type") {
      return ["json", "text", "blob", "arraybuffer"].includes(item);
    }
    if (valueType === "record_string_string") {
      return (
        typeof item === "object" &&
        Object.keys(item).every((key) => typeof key === "string" && typeof item[key] === "string")
      );
    }
    return super.validateItem(valueType, item);
  }
}

TaskRegistry.registerTask(FetchTask);

export const Fetch = (input: FetchTaskInput) => {
  return new FetchTask({ input }).run();
};

declare module "@ellmers/task-graph" {
  interface TaskGraphBuilder {
    Fetch: TaskGraphBuilderHelper<FetchTaskInput>;
  }
}

TaskGraphBuilder.prototype.Fetch = TaskGraphBuilderHelper(FetchTask);
