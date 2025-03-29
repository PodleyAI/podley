//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  Workflow,
  CreateWorkflow,
  TaskRegistry,
  JobQueueTask,
  JobQueueTaskConfig,
  TaskInvalidInputError,
  TaskConfig,
} from "@ellmers/task-graph";
import { AbortSignalJobError, Job, PermanentJobError, RetryableJobError } from "@ellmers/job-queue";
import { JSONValue } from "@ellmers/storage";
import { FormatRegistry, Type } from "@sinclair/typebox";

FormatRegistry.Set("url", (value) => {
  if (value && typeof value === "string") {
    try {
      new URL(value);
    } catch {
      return false;
    }
  }
  return true;
});

export type url = string;
export type FetchTaskInput = {
  url: url;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string;
  response_type?: "json" | "text" | "blob" | "arraybuffer";
  queueName?: string;
};
export type FetchTaskOutput = {
  json?: JSONValue;
  text?: string;
  blob?: Blob;
  arraybuffer?: ArrayBuffer;
};

export type FetchTaskConfig = TaskConfig & {
  queueName?: string;
};

async function fetchWithProgress(
  url: string,
  options: RequestInit = {},
  onProgress?: (progress: number) => void
): Promise<Response> {
  if (!options.signal) {
    throw new Error("An AbortSignal must be provided.");
  }

  const response = await fetch(url, options);
  if (!response.body) {
    throw new Error("ReadableStream not supported in this environment.");
  }

  const contentLength = response.headers.get("Content-Length");
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
  let receivedBytes = 0;
  const reader = response.body.getReader();

  // Create a new ReadableStream that supports progress updates
  const stream = new ReadableStream({
    start(controller) {
      async function push() {
        try {
          while (true) {
            // Check if the request was aborted
            if (options.signal?.aborted) {
              controller.error(new AbortSignalJobError("Fetch aborted"));
              reader.cancel();
              return;
            }

            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
            receivedBytes += value.length;
            if (onProgress && totalBytes) {
              onProgress((receivedBytes / totalBytes) * 100);
            }
          }
        } catch (error) {
          controller.error(error);
        }
      }
      push();
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

/**
 * Extends the base Job class to provide custom execution functionality
 * through a provided function.
 */
export class FetchJob<
  Input extends FetchTaskInput = FetchTaskInput,
  Output = FetchTaskOutput,
> extends Job<Input, Output> {
  constructor(config: JobQueueTaskConfig & { input: Input } = { input: {} as Input }) {
    super(config);
  }
  static readonly type: string = "FetchJob";
  /**
   * Executes the job using the provided function.
   */
  async execute(signal: AbortSignal): Promise<Output> {
    const response = await fetchWithProgress(
      this.input.url!,
      {
        method: this.input.method,
        headers: this.input.headers,
        body: this.input.body,
        signal: signal,
      },
      this.updateProgress.bind(this)
    );

    if (response.ok) {
      if (this.input.response_type === "json") {
        return { json: await response.json() } as Output;
      } else if (this.input.response_type === "text") {
        return { text: await response.text() } as Output;
      } else if (this.input.response_type === "blob") {
        return { blob: await response.blob() } as Output;
      } else if (this.input.response_type === "arraybuffer") {
        return { arraybuffer: await response.arrayBuffer() } as Output;
      }
      throw new TaskInvalidInputError(`Invalid response type: ${this.input.response_type}`);
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
export class FetchTask<
  Input extends FetchTaskInput = FetchTaskInput,
  Output extends FetchTaskOutput = FetchTaskOutput,
  Config extends FetchTaskConfig = FetchTaskConfig,
> extends JobQueueTask<Input, Output, Config> {
  public static type = "FetchTask";
  public static category = "Input";

  public static inputSchema = Type.Object({
    url: Type.String({
      title: "URL",
      format: "url",
    }),
    method: Type.Optional(
      Type.Union(
        [
          Type.Literal("GET"),
          Type.Literal("POST"),
          Type.Literal("PUT"),
          Type.Literal("DELETE"),
          Type.Literal("PATCH"),
        ],
        {
          title: "Method",
          default: "GET",
        }
      )
    ),
    headers: Type.Optional(
      Type.Record(Type.String(), Type.String(), {
        title: "Headers",
      })
    ),
    body: Type.Optional(
      Type.String({
        title: "Body",
      })
    ),
    response_type: Type.Optional(
      Type.Union(
        [
          Type.Literal("json"),
          Type.Literal("text"),
          Type.Literal("blob"),
          Type.Literal("arraybuffer"),
        ],
        {
          title: "Response Type",
          default: "json",
        }
      )
    ),
    queueName: Type.Optional(
      Type.String({
        title: "Queue Name",
      })
    ),
  });

  public static outputSchema = Type.Object({
    json: Type.Optional(
      Type.Any({
        title: "JSON Response",
      })
    ),
    text: Type.Optional(
      Type.String({
        title: "Text Response",
      })
    ),
    blob: Type.Optional(
      Type.Any({
        title: "Blob Response",
      })
    ),
    arraybuffer: Type.Optional(
      Type.Any({
        title: "ArrayBuffer Response",
      })
    ),
  });

  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    config.queueName = input?.queueName ?? config.queueName;

    super(input, config);
    this.jobClass = FetchJob;
  }
}

TaskRegistry.registerTask(FetchTask);

export const Fetch = async (
  input: FetchTaskInput,
  config: TaskConfig = {}
): Promise<FetchTaskOutput> => {
  const result = await new FetchTask(input, config).run();
  return result as FetchTaskOutput;
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    Fetch: CreateWorkflow<FetchTaskInput, FetchTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.Fetch = CreateWorkflow(FetchTask);
