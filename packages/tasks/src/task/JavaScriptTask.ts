//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Interpreter } from "../util/interpreter";
import { TaskConfig, Workflow, CreateWorkflow, TaskRegistry, Task, type JSONSchema7ObjectDefinition } from "@podley/task-graph";
import { TObject, Type } from "@sinclair/typebox";

export type JavaScriptTaskInput = {
  code: string;
  input: any;
};
export type JavaScriptTaskOutput = {
  output: any;
};

export class JavaScriptTask extends Task<JavaScriptTaskInput, JavaScriptTaskOutput> {
  public static type = "JavaScriptTask";
  public static category = "Utility";
  public static title = "JavaScript Interpreter";
  public static description = "Executes JavaScript code in a sandboxed interpreter environment";

  public static inputSchema(): JSONSchema7ObjectDefinition {
    return Type.Object({
      code: Type.String({
        title: "Code",
        description: "JavaScript code to execute",
      }),
      input: Type.Optional(
        Type.Any({
          title: "Input",
          description: "Input data to pass to the JavaScript code",
        })
      ),
    }) as JSONSchema7ObjectDefinition;
  }

  public static outputSchema(): JSONSchema7ObjectDefinition {
    return Type.Object({
      output: Type.Unknown({
        title: "Output",
        description: "The output of the JavaScript code",
      }),
    }) as JSONSchema7ObjectDefinition;
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
