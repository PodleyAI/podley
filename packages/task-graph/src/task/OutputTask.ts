/**
 * @copyright
 * Copyright 2025 Steven Roussey
 * All Rights Reserved
 */

import { IExecuteContext, IExecuteReactiveContext, Task, TaskConfig } from "@workglow/task-graph";
import type { DataPortSchema } from "@workglow/util";

export type OutputTaskInput = Record<string, unknown>;
export type OutputTaskOutput = Record<string, unknown>;

export type OutputTaskConfig = TaskConfig & {
  schema: DataPortSchema;
};

export class OutputTask extends Task<OutputTaskInput, OutputTaskOutput, OutputTaskConfig> {
  static type = "OutputTask";
  static category = "Flow Control";
  static title = "Output";
  static description = "Ends the workflow";
  static hasDynamicSchemas = true;
  static cacheable = false;

  public static inputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {},
      additionalProperties: true,
    } as const as DataPortSchema;
  }

  public static outputSchema(): DataPortSchema {
    return {
      type: "object",
      properties: {},
      additionalProperties: true,
    } as const as DataPortSchema;
  }

  public inputSchema(): DataPortSchema {
    return (
      (this.config?.extras?.inputSchema as DataPortSchema | undefined) ??
      (this.constructor as typeof OutputTask).inputSchema()
    );
  }

  public outputSchema(): DataPortSchema {
    return (
      (this.config?.extras?.outputSchema as DataPortSchema | undefined) ??
      (this.constructor as typeof OutputTask).outputSchema()
    );
  }

  public async execute(input: OutputTaskInput, _context: IExecuteContext) {
    return input as OutputTaskOutput;
  }

  public async executeReactive(
    input: OutputTaskInput,
    _output: OutputTaskOutput,
    _context: IExecuteReactiveContext
  ) {
    return input as OutputTaskOutput;
  }
}
