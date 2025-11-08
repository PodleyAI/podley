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
import { z } from "zod";
import { Interpreter } from "../util/interpreter";

const inputSchema = z.object({
  code: z.string().describe("JavaScript code to execute"),
  input: z.any().optional().describe("Input data to pass to the JavaScript code"),
});
const outputSchema = z.object({
  output: z.any().describe("The output of the JavaScript code"),
});
export type JavaScriptTaskInput = z.infer<typeof inputSchema>;
export type JavaScriptTaskOutput = z.infer<typeof outputSchema>;

export class JavaScriptTask extends Task<JavaScriptTaskInput, JavaScriptTaskOutput> {
  public static type = "JavaScriptTask";
  public static category = "Utility";
  public static title = "JavaScript Interpreter";
  public static description = "Executes JavaScript code in a sandboxed interpreter environment";

  public static inputSchema(): DataPortSchema {
    return inputSchema as DataPortSchema;
  }

  public static outputSchema(): DataPortSchema {
    return outputSchema as DataPortSchema;
  }

  async executeReactive(input: JavaScriptTaskInput, output: JavaScriptTaskOutput) {
    if (input.code) {
      try {
        const myInterpreter = new Interpreter(input.code);
        myInterpreter.run();
        output.output = myInterpreter.value;
      } catch (e) {
        console.error("error", e);
      }
    }
    return output;
  }
}

TaskRegistry.registerTask(JavaScriptTask);

export const JavaScript = (input: JavaScriptTaskInput, config: TaskConfig = {}) => {
  return new JavaScriptTask(input, config).run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    JavaScript: CreateWorkflow<JavaScriptTaskInput, JavaScriptTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.JavaScript = CreateWorkflow(JavaScriptTask);
