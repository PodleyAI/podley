// //    *******************************************************************************
// //    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
// //    *                                                                             *
// //    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
// //    *   Licensed under the Apache License, Version 2.0 (the "License");           *
// //    *******************************************************************************

import {
  TaskConfig,
  JsonTaskItem,
  Dataflow,
  Workflow,
  CreateWorkflow,
  TaskRegistry,
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskInput,
  TaskOutput,
  createGraphFromDependencyJSON,
  TaskWithSubgraph,
} from "@ellmers/task-graph";

interface JsonTaskInput extends TaskInput {
  json: string;
}

interface JsonTaskOutput extends TaskOutput {
  output: any;
}

/**
 * JsonTask is a specialized task that creates and manages task graphs from JSON configurations.
 * It allows dynamic creation of task networks by parsing JSON definitions of tasks and their relationships.
 */
export class JsonTask<
  Input extends JsonTaskInput = JsonTaskInput,
  Output extends JsonTaskOutput = JsonTaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends TaskWithSubgraph<Input, Output, Config> {
  static readonly type = "JsonTask";
  static readonly category = "Utility";
  static readonly isCompound = true;
  public static inputs: TaskInputDefinition[] = [
    {
      id: "json",
      name: "JSON",
      valueType: "text", // Expects JSON string input
    },
  ] as const;

  public static outputs: TaskOutputDefinition[] = [
    {
      id: "output",
      name: "Output",
      valueType: "any", // Output type depends on the generated task graph
    },
  ] as const;

  /**
   * Regenerates the entire task graph based on the current JSON input
   * Creates task nodes and establishes data flow connections between them
   */
  public regenerateGraph() {
    if (!this.runInputData.json) return;
    let data = JSON.parse(this.runInputData.json) as JsonTaskItem[] | JsonTaskItem;
    if (!Array.isArray(data)) data = [data];
    const jsonItems: JsonTaskItem[] = data as JsonTaskItem[];

    // Create task nodes
    this.subGraph = createGraphFromDependencyJSON(jsonItems);

    // Establish data flow connections
    for (const item of jsonItems) {
      if (!item.dependencies) continue;
      for (const [input, dependency] of Object.entries(item.dependencies)) {
        const dependencies = Array.isArray(dependency) ? dependency : [dependency];
        for (const dep of dependencies) {
          const sourceTask = this.subGraph.getTask(dep.id);
          if (!sourceTask) {
            throw new Error(`Dependency id ${dep.id} not found`);
          }
          const df = new Dataflow(sourceTask.config.id, dep.output, item.id, input);
          this.subGraph.addDataflow(df);
        }
      }
    }
    super.regenerateGraph();
  }
}

// Register JsonTask with the task registry
TaskRegistry.registerTask(JsonTask);

/**
 * Convenience function to create and run a JsonTask
 */
export const Json = (input: JsonTaskInput, config: TaskConfig = {}) => {
  return new JsonTask(input, config).run();
};

// Add Json task workflow to Workflow interface
declare module "@ellmers/task-graph" {
  interface Workflow {
    Json: CreateWorkflow<JsonTaskInput, JsonTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.Json = CreateWorkflow(JsonTask);
