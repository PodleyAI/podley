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
  JobQueueTask,
  JobQueueTaskConfig,
  TaskInputDefinition,
  TaskOutputDefinition,
} from "@ellmers/task-graph";
import { Job, PermanentJobError, RetryableJobError } from "@ellmers/job-queue";

export type url = string;
export type FetchTaskInput = {
  url?: url;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string;
  response_type?: "json" | "text" | "blob" | "arraybuffer";
  queueName?: string;
};
export type FetchTaskOutput = {
  output?: any;
};

/**
 * Extends the base Job class to provide custom execution functionality
 * through a provided function.
 */
export class FetchJob extends Job<FetchTaskInput, FetchTaskOutput> {
  constructor(
    config: JobQueueTaskConfig & { input: FetchTaskInput } = { input: {} as FetchTaskInput }
  ) {
    super(config);
  }
  static readonly type: string = "FetchJob";
  /**
   * Executes the job using the provided function.
   */
  async execute(signal: AbortSignal): Promise<FetchTaskOutput> {
    let result: any = null;
    const response = await fetch(this.input.url!, {
      method: this.input.method,
      headers: this.input.headers,
      body: this.input.body,
      signal: signal,
    });

    if (response.ok) {
      if (this.input.response_type === "json") {
        result = await response.json();
      } else if (this.input.response_type === "text") {
        result = await response.text();
      } else if (this.input.response_type === "blob") {
        result = await response.blob();
      } else if (this.input.response_type === "arraybuffer") {
        result = await response.arrayBuffer();
      }
      return { output: result };
    } else {
      if (
        response.status === 429 ||
        response.status === 503 ||
        response.headers.get("Retry-After")
      ) {
        let retryDate: Date | undefined;
        const retryAfterStr = response.headers.get("Retry-After");
        if (retryAfterStr) {
          // Try parsing as HTTP date first
          const parsedDate = new Date(retryAfterStr);
          if (!isNaN(parsedDate.getTime()) && parsedDate > new Date()) {
            // Only use the date if it's in the future
            retryDate = parsedDate;
          } else {
            // If not a valid future date, treat as seconds
            const retryAfterSeconds = parseInt(retryAfterStr) * 1000;
            if (!isNaN(retryAfterSeconds)) {
              retryDate = new Date(Date.now() + retryAfterSeconds);
            }
          }
        }

        throw new RetryableJobError(
          `Failed to fetch ${this.input.url}: ${response.status} ${response.statusText}`,
          retryDate
        );
      } else {
        throw new PermanentJobError(
          `Failed to fetch ${this.input.url}: ${response.status} ${response.statusText}`
        );
      }
    }
  }
}

/**
 * FetchTask provides a task for fetching data from a URL.
 */
export class FetchTask extends JobQueueTask {
  static readonly type: string = "FetchTask";
  static readonly category = "Input";
  declare runInputData: FetchTaskInput;
  declare runOutputData: FetchTaskOutput;
  public static inputs: TaskInputDefinition[] = [
    {
      id: "url",
      name: "URL",
      valueType: "url",
    },
    {
      id: "method",
      name: "Method",
      valueType: "method",
      defaultValue: "GET",
      optional: true,
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
      valueType: "text",
      optional: true,
    },
    {
      id: "response_type",
      name: "Response Type",
      valueType: "response_type",
      defaultValue: "json",
      optional: true,
    },
    {
      id: "queueName",
      name: "Queue Name",
      valueType: "text",
      optional: true,
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: "output", name: "Output", valueType: "any" },
  ] as const;

  constructor(config: JobQueueTaskConfig & { input?: FetchTaskInput } = {}) {
    config.queueName = config.input?.queueName ?? config.queueName;

    super(config);
    this.jobClass = FetchJob;
  }

  async runReactive(): Promise<FetchTaskOutput> {
    return this.runOutputData ?? { output: null };
  }

  async validateItem(valueType: string, item: any) {
    if (valueType === "url") {
      try {
        if (item instanceof URL) {
          return true;
        }
        new URL(item); // This will throw an error if the URL is invalid
        return true;
      } catch (err) {
        console.log("url is invalid", err);
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
    return await super.validateItem(valueType, item);
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
