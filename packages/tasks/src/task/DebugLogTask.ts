//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  Workflow,
  TaskRegistry,
  OutputTask,
  TaskInputDefinition,
  TaskOutputDefinition,
  CreateWorkflow,
  TaskInvalidInputError,
  DATAFLOW_ALL_PORTS,
  TaskInput,
  TaskOutput,
} from "@ellmers/task-graph";

const log_levels = ["dir", "log", "debug", "info", "warn", "error"] as const;
type LogLevel = (typeof log_levels)[number];

export type DebugLogTaskInput = TaskInput & {
  log_level: LogLevel;
};
export type DebugLogTaskOutput = TaskOutput;

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
export class DebugLogTask extends OutputTask {
  static readonly type: string = "DebugLogTask";
  static readonly category = "Output";
  declare runInputData: DebugLogTaskInput;
  declare runOutputData: DebugLogTaskOutput;
  public static inputs: TaskInputDefinition[] = [
    {
      id: DATAFLOW_ALL_PORTS,
      name: "Input",
      valueType: "any",
    },
    {
      id: "log_level",
      name: "Level",
      valueType: "log_level",
      defaultValue: DEFAULT_LOG_LEVEL,
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    { id: DATAFLOW_ALL_PORTS, name: "Output", valueType: "any" },
  ] as const;

  async runReactive() {
    const { log_level = DEFAULT_LOG_LEVEL, ...message } = this.runInputData;
    if (log_level == "dir") {
      console.dir(message, { depth: null });
    } else {
      console[log_level](message);
    }
    this.runOutputData = message;
    return this.runOutputData;
  }

  async validateItem(valueType: string, item: any) {
    if (valueType == "log_level") {
      const valid = log_levels.includes(item);
      if (!valid) {
        throw new TaskInvalidInputError(`${item} is not a valid log level`);
      }
      return valid;
    }
    return super.validateItem(valueType, item);
  }
}

TaskRegistry.registerTask(DebugLogTask);

export const DebugLog = (input: DebugLogTaskInput) => {
  return new DebugLogTask({ input }).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    DebugLog: CreateWorkflow<DebugLogTaskInput>;
  }
}

Workflow.prototype.DebugLog = CreateWorkflow(DebugLogTask);
