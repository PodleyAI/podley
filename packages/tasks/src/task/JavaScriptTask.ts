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
  constructor(config: TaskConfig & { input?: JavaScriptTaskInput } = {}) {
    super(config);
  }
  async executeReactive() {
    if (this.runInputData.code) {
      try {
        const myInterpreter = new Interpreter(this.runInputData.code);
        myInterpreter.run();
        this.runOutputData.output = myInterpreter.value;
      } catch (e) {
        console.error("error", e);
      }
    }
    return this.runOutputData;
  }
}
TaskRegistry.registerTask(JavaScriptTask);

export const JavaScript = (input: JavaScriptTaskInput) => {
  return new JavaScriptTask(input).run();
};

declare module "@ellmers/task-graph" {
  interface Workflow {
    JavaScript: CreateWorkflow<JavaScriptTaskInput, JavaScriptTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.JavaScript = CreateWorkflow(JavaScriptTask);
