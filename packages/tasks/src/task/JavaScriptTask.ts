//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Interpreter } from "../util/interpreter";
import {
  TaskConfig,
  Workflow,
  CreateWorkflow,
  TaskRegistry,
  TaskInputDefinition,
  TaskOutputDefinition,
  Task,
} from "@ellmers/task-graph";

export type JavaScriptTaskInput = {
  code: string;
  input: any;
};
export type JavaScriptTaskOutput = {
  output: any;
};

export class JavaScriptTask extends Task<JavaScriptTaskInput, JavaScriptTaskOutput> {
  static readonly type = "JavaScriptTask";
  static readonly category = "Utility";
  public static inputs: TaskInputDefinition[] = [
    {
      id: "code",
      name: "Code",
      valueType: "text",
    },
    {
      id: "input",
      name: "Input",
      valueType: "any",
    },
  ] as const;
  public static outputs: TaskOutputDefinition[] = [
    {
      id: "output",
      name: "Output",
      valueType: "any",
    },
  ] as const;

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

declare module "@ellmers/task-graph" {
  interface Workflow {
    JavaScript: CreateWorkflow<JavaScriptTaskInput, JavaScriptTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.JavaScript = CreateWorkflow(JavaScriptTask);
