//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  CreateWorkflow,
  Task,
  TaskConfig,
  TaskRegistry,
  Workflow,
  type DataPortSchema,
} from "@podley/task-graph";
import { Static, Type } from "@sinclair/typebox";

const log_levels = ["dir", "log", "debug", "info", "warn", "error"] as const;
type LogLevel = (typeof log_levels)[number];
const DEFAULT_LOG_LEVEL: LogLevel = "log";

const inputSchema = Type.Object({
  console: Type.Optional(
    Type.String({
      title: "Message",
      description: "The message to log",
    })
  ),
  log_level: Type.Optional(
    Type.Union(
      log_levels.map((level) => Type.Literal(level)),
      {
        title: "Log Level",
        description: "The log level to use",
        default: DEFAULT_LOG_LEVEL,
      }
    )
  ),
});

const outputSchema = Type.Object({
  console: Type.Unknown({
    title: "Messages",
    description: "The messages logged by the task",
  }),
});

export type DebugLogTaskInput = Static<typeof inputSchema>;
export type DebugLogTaskOutput = Static<typeof outputSchema>;

/**
 * DebugLogTask provides console logging functionality as a task within the system.
 *
 * Features:
 * - Supports multiple log levels (info, warn, error, dir)
 * - Passes through the logged message as output
 * - Configurable logging format and depth
 *
 * This task is particularly useful for debugging task graphs and monitoring
 * data flow between tasks during development and testing.
 */
export class DebugLogTask<
  Input extends DebugLogTaskInput = DebugLogTaskInput,
  Output extends DebugLogTaskOutput = DebugLogTaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends Task<Input, Output, Config> {
  public static type = "DebugLogTask";
  public static category = "Utility";
  public static title = "Debug Log";
  public static description =
    "Logs messages to the console with configurable log levels for debugging task graphs";
  static readonly cacheable = false;

  public static inputSchema(): DataPortSchema {
    return inputSchema as DataPortSchema;
  }

  public static outputSchema(): DataPortSchema {
    return outputSchema as DataPortSchema;
  }

  async executeReactive(input: Input, output: Output) {
    const { log_level = DEFAULT_LOG_LEVEL, console: messages } = input;
    if (log_level == "dir") {
      console.dir(messages, { depth: null });
    } else {
      console[log_level](messages);
    }
    output.console = input.console;
    return output;
  }
}

TaskRegistry.registerTask(DebugLogTask);

export const DebugLog = (input: DebugLogTaskInput, config: TaskConfig = {}) => {
  return new DebugLogTask(input, config).run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    DebugLog: CreateWorkflow<DebugLogTaskInput, DebugLogTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.DebugLog = CreateWorkflow(DebugLogTask);
