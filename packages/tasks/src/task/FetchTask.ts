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
  type DataPortSchema,
} from "@podley/task-graph";
import { Static, Type } from "@sinclair/typebox";

const inputSchema = Type.Object({
  url: Type.String({
    title: "URL",
    description: "The URL to fetch from",
    format: "uri",
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
        description: "The HTTP method to use",
        default: "GET",
      }
    )
  ),
  headers: Type.Optional(
    Type.Record(Type.String(), Type.String(), {
      title: "Headers",
      description: "The headers to send with the request",
    })
  ),
  body: Type.Optional(
    Type.String({
      title: "Body",
      description: "The body of the request",
    }),
    true
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
  timeout: Type.Optional(
    Type.Number({
      title: "Timeout",
      description: "Request timeout in milliseconds",
    })
  ),
  queue: Type.Optional(
    Type.Union([Type.Boolean(), Type.String()], {
      description: "Queue handling: false=run inline, true=use default, string=explicit queue name",
      default: true,
    })
  ),
});

const outputSchema = Type.Object({
  json: Type.Optional(
    Type.Any({
      title: "JSON",
      description: "The JSON response",
    })
  ),
  text: Type.Optional(
    Type.String({
      title: "Text",
      description: "The text response",
    })
  ),
  blob: Type.Optional(Type.Unsafe<Blob>({ type: "blob" })),
  arraybuffer: Type.Optional(Type.Unsafe<ArrayBuffer>({ type: "arraybuffer" })),
});

export type FetchTaskInput = Static<typeof inputSchema>;
export type FetchTaskOutput = Static<typeof outputSchema>;

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

  public static inputSchema(): DataPortSchema {
    return inputSchema as DataPortSchema;
  }

  public static outputSchema(): DataPortSchema {
    return outputSchema as DataPortSchema;
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
