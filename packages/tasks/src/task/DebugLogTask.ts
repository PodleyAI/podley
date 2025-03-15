//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  Workflow,
  TaskRegistry,
  TaskInputDefinition,
  TaskOutputDefinition,
  CreateWorkflow,
  TaskInvalidInputError,
  TaskConfig,
  Task,
} from "@ellmers/task-graph";

const log_levels = ["dir", "log", "debug", "info", "warn", "error"] as const;
type LogLevel = (typeof log_levels)[number];

export type DebugLogTaskInput = {
  console: any;
  log_level: LogLevel;
};
export type DebugLogTaskOutput = {
  console: any;
};

const DEFAULT_LOG_LEVEL: LogLevel = "log";

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
  static type = "DebugLogTask";
  static category = "Output";
  static readonly cacheable = false;
  public static inputs: TaskInputDefinition[] = [
    {
      id: "console",
      name: "Messages",
      valueType: "any",
      isArray: true,
    },
    {
      id: "log_level",
      name: "Level",
      valueType: "log_level",
      defaultValue: DEFAULT_LOG_LEVEL,
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    {
      id: "console",
      name: "Messages",
      valueType: "any",
    },
  ] as const;

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

  async validateInputValue(valueType: string, item: any) {
    if (valueType == "log_level") {
      const valid = log_levels.includes(item);
      if (!valid) {
        throw new TaskInvalidInputError(`${item} is not a valid log level`);
      }
      return valid;
    }
    return super.validateInputValue(valueType, item);
  }
}

TaskRegistry.registerTask(DebugLogTask);

export const DebugLog = (input: DebugLogTaskInput, config: TaskConfig = {}) => {
  return new DebugLogTask(input, config).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    DebugLog: CreateWorkflow<DebugLogTaskInput, DebugLogTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.DebugLog = CreateWorkflow(DebugLogTask);
