//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  AbortSignalJobError,
  IJobExecuteContext,
  Job,
  PermanentJobError,
  RetryableJobError,
} from "@podley/job-queue";
import {
  CreateWorkflow,
  JobQueueTask,
  JobQueueTaskConfig,
  TaskConfigurationError,
  TaskInvalidInputError,
  TaskRegistry,
  Workflow,
} from "@podley/task-graph";
import { DataPortSchema, FromSchema } from "@podley/util";

const inputSchema = {
  type: "object",
  properties: {
    url: {
      type: "string",
      title: "URL",
      description: "The URL to fetch from",
      format: "uri",
    },
    method: {
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      title: "Method",
      description: "The HTTP method to use",
      default: "GET",
    },
    headers: {
      type: "object",
      additionalProperties: {
        type: "string",
      },
      title: "Headers",
      description: "The headers to send with the request",
    },
    body: {
      type: "string",
      title: "Body",
      description: "The body of the request",
    },
    response_type: {
      enum: ["json", "text", "blob", "arraybuffer"],
      title: "Response Type",
      default: "json",
    },
    timeout: {
      type: "number",
      title: "Timeout",
      description: "Request timeout in milliseconds",
    },
    queue: {
      oneOf: [{ type: "boolean" }, { type: "string" }],
      description: "Queue handling: false=run inline, true=use default, string=explicit queue name",
      default: true,
    },
  },
  required: ["url"],
} as const satisfies DataPortSchema;

const outputSchema = {
  type: "object",
  properties: {
    json: {
      title: "JSON",
      description: "The JSON response",
    },
    text: {
      type: "string",
      title: "Text",
      description: "The text response",
    },
    blob: {
      title: "Blob",
      description: "The blob response",
    },
    arraybuffer: {
      title: "ArrayBuffer",
      description: "The arraybuffer response",
    },
  },
} as const satisfies DataPortSchema;

export type FetchTaskInput = FromSchema<typeof inputSchema>;
export type FetchTaskOutput = FromSchema<typeof outputSchema>;

export type FetchTaskConfig = JobQueueTaskConfig;

async function fetchWithProgress(
  url: string,
  options: RequestInit = {},
  onProgress?: (progress: number) => Promise<void>
): Promise<Response> {
  if (!options.signal) {
    throw new TaskConfigurationError("An AbortSignal must be provided.");
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
              await onProgress((receivedBytes / totalBytes) * 100);
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
  async execute(input: Input, context: IJobExecuteContext): Promise<Output> {
    const response = await fetchWithProgress(
      input.url!,
      {
        method: input.method,
        headers: input.headers,
        body: input.body,
        signal: context.signal,
      },
      async (progress: number) => await context.updateProgress(progress)
    );

    if (response.ok) {
      if (input.response_type === "json") {
        return { json: await response.json() } as Output;
      } else if (input.response_type === "text") {
        return { text: await response.text() } as Output;
      } else if (input.response_type === "blob") {
        return { blob: await response.blob() } as Output;
      } else if (input.response_type === "arraybuffer") {
        return { arraybuffer: await response.arrayBuffer() } as Output;
      }
      throw new TaskInvalidInputError(`Invalid response type: ${input.response_type}`);
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
          `Failed to fetch ${input.url}: ${response.status} ${response.statusText}`,
          retryDate
        );
      } else {
        throw new PermanentJobError(
          `Failed to fetch ${input.url}: ${response.status} ${response.statusText}`
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
  public static title = "Fetch";
  public static description =
    "Fetches data from a URL with progress tracking and automatic retry handling";

  public static inputSchema() {
    return inputSchema;
  }

  public static outputSchema() {
    return outputSchema;
  }

  constructor(input: Input = {} as Input, config: Config = {} as Config) {
    config.queue = input?.queue ?? config.queue;
    if (config.queue === undefined) {
      config.queue = false; // change default to false to run directly
    }
    super(input, config);
    this.jobClass = FetchJob;
  }

  protected override async getDefaultQueueName(input: Input): Promise<string | undefined> {
    if (!input.url) {
      return `fetch:${this.type}`;
    }
    try {
      const hostname = new URL(input.url).hostname.toLowerCase();
      const parts = hostname.split(".").filter(Boolean);
      if (parts.length === 0) {
        return `fetch:${this.type}`;
      }
      const domain = parts.length <= 2 ? parts.join(".") : parts.slice(-2).join(".");
      return `fetch:${domain}`;
    } catch {
      return `fetch:${this.type}`;
    }
  }
}

TaskRegistry.registerTask(FetchTask);

export const Fetch = async (
  input: FetchTaskInput,
  config: FetchTaskConfig = {}
): Promise<FetchTaskOutput> => {
  const result = await new FetchTask(input, config).run();
  return result as FetchTaskOutput;
};

declare module "@podley/task-graph" {
  interface Workflow {
    Fetch: CreateWorkflow<FetchTaskInput, FetchTaskOutput, FetchTaskConfig>;
  }
}

Workflow.prototype.Fetch = CreateWorkflow(FetchTask);
