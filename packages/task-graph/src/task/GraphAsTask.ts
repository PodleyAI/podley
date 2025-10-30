//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { TaskGraph } from "../task-graph/TaskGraph";
import { CompoundMergeStrategy } from "../task-graph/TaskGraphRunner";
import { Task } from "./Task";
import type { JsonTaskItem, TaskGraphItemJson } from "./TaskJSON";
import { type TaskConfig, type TaskInput, type TaskOutput, type TaskTypeName } from "./TaskTypes";
import { GraphAsTaskRunner } from "./GraphAsTaskRunner";
import { Type, TObject } from "@sinclair/typebox";

export interface GraphAsTaskConfig extends TaskConfig {
  subGraph?: TaskGraph;
  compoundMerge?: CompoundMergeStrategy;
}

/**
 * A task that contains a subgraph of tasks
 */
export class GraphAsTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends GraphAsTaskConfig = GraphAsTaskConfig,
> extends Task<Input, Output, Config> {
  // ========================================================================
  // Static properties - should be overridden by subclasses
  // ========================================================================

  public static type: TaskTypeName = "GraphAsTask";
  public static category: string = "Hidden";
  public static compoundMerge: CompoundMergeStrategy = "last-or-property-array";

  // ========================================================================
  // Constructor
  // ========================================================================

  constructor(input: Partial<Input> = {}, config: Partial<Config> = {}) {
    const { subGraph, ...rest } = config;
    super(input, rest as Config);
    if (subGraph) {
      this.subGraph = subGraph;
    }
    this.regenerateGraph();
  }

  // ========================================================================
  // TaskRunner delegation - Executes and manages the task
  // ========================================================================

  declare _runner: GraphAsTaskRunner<Input, Output, Config>;

  /**
   * Task runner for handling the task execution
   */
  override get runner(): GraphAsTaskRunner<Input, Output, Config> {
    if (!this._runner) {
      this._runner = new GraphAsTaskRunner<Input, Output, Config>(this);
    }
    return this._runner;
  }

  // ========================================================================
  // Static to Instance conversion methods
  // ========================================================================

  public get compoundMerge(): CompoundMergeStrategy {
    return this.config?.compoundMerge || (this.constructor as typeof GraphAsTask).compoundMerge;
  }

  public get cacheable(): boolean {
    return (
      // if cacheable is set in config, always use that
      this.config?.cacheable ??
      ((this.constructor as typeof GraphAsTask).cacheable && !this.hasChildren())
    );
  }

  // ========================================================================
  // Input/Output handling
  // ========================================================================

  /**
   * Override inputSchema to compute it dynamically from the subgraph at runtime
   * The input schema is the union of all unconnected inputs from all nodes
   */
  get inputSchema(): TObject {
    // If there's no subgraph or it has no children, fall back to the static schema
    if (!this.hasChildren()) {
      return (this.constructor as typeof Task).inputSchema();
    }

    const properties: Record<string, any> = {};
    const required: string[] = [];

    // For all tasks in the graph, collect their unconnected inputs
    const tasks = this.subGraph.getTasks();

    for (const task of tasks) {
      const taskInputSchema = task.inputSchema;
      const taskProperties = taskInputSchema.properties || {};
      
      // Get all inputs that are connected via dataflows
      const connectedInputs = new Set(
        this.subGraph.getSourceDataflows(task.config.id).map((df) => df.targetTaskPortId)
      );

      // Add unconnected inputs to the graph's input schema
      for (const [inputName, inputProp] of Object.entries(taskProperties)) {
        if (!connectedInputs.has(inputName)) {
          // If the same input name exists in multiple nodes, we use the first one
          // In a more sophisticated implementation, we might want to merge or validate compatibility
          if (!properties[inputName]) {
            properties[inputName] = inputProp;
            
            // Check if this input is required
            if (taskInputSchema.required && taskInputSchema.required.includes(inputName)) {
              required.push(inputName);
            }
          }
        }
      }
    }

    return Type.Object(properties, required.length > 0 ? { required } : {});
  }

  /**
   * Override outputSchema to compute it dynamically from the subgraph at runtime
   * The output schema depends on the compoundMerge strategy and the ending nodes
   */
  get outputSchema(): TObject {
    // If there's no subgraph or it has no children, fall back to the static schema
    if (!this.hasChildren()) {
      return (this.constructor as typeof Task).outputSchema();
    }

    const properties: Record<string, any> = {};
    const required: string[] = [];

    // Find all ending nodes (nodes with no outgoing dataflows)
    const tasks = this.subGraph.getTasks();
    const endingNodes = tasks.filter(
      (task) => this.subGraph.getTargetDataflows(task.config.id).length === 0
    );

    const merge = this.compoundMerge;

    // Handle different merge strategies
    if (merge === "last" || (merge.startsWith("last-or-") && endingNodes.length === 1)) {
      // For "last" or single ending node with "last-or-*", return the schema of the last/only node
      const lastNode = endingNodes[endingNodes.length - 1];
      if (lastNode) {
        return lastNode.outputSchema;
      }
    } else if (merge === "named" || merge === "last-or-named") {
      // For "named" strategies, the output is an array of {id, type, data}
      // This is harder to represent as a schema, so we use a generic structure
      return Type.Array(
        Type.Object({
          id: Type.String(),
          type: Type.String(),
          data: Type.Any(),
        })
      );
    } else if (merge === "unordered-array" || merge === "last-or-unordered-array") {
      // For array strategies, output is { data: [...] }
      return Type.Object({
        data: Type.Array(Type.Any()),
      });
    } else if (merge === "property-array" || merge === "last-or-property-array") {
      // For property-array strategies, collect properties from all ending nodes
      // Each property becomes an array if multiple nodes have it
      for (const task of endingNodes) {
        const taskOutputSchema = task.outputSchema;
        const taskProperties = taskOutputSchema.properties || {};

        for (const [outputName, outputProp] of Object.entries(taskProperties)) {
          if (!properties[outputName]) {
            // Convert property to array type for property-array merge
            if (endingNodes.length > 1) {
              properties[outputName] = Type.Array(outputProp as any);
            } else {
              properties[outputName] = outputProp;
            }
            
            // For property-array, properties are generally optional since not all ending nodes may have them
            // Don't add to required array
          }
        }
      }
    }

    return Type.Object(properties, required.length > 0 ? { required } : {});
  }

  /**
   * Resets input data to defaults
   */
  public resetInputData(): void {
    super.resetInputData();
    if (this.hasChildren()) {
      this.subGraph!.getTasks().forEach((node) => {
        node.resetInputData();
      });
      this.subGraph!.getDataflows().forEach((dataflow) => {
        dataflow.reset();
      });
    }
  }

  // ========================================================================
  //  Compound task methods
  // ========================================================================

  /**
   * Regenerates the subtask graph and emits a "regenerate" event
   *
   * Subclasses should override this method to implement the actual graph
   * regeneration logic, but all they need to do is call this method to
   * emit the "regenerate" event.
   */
  public regenerateGraph(): void {
    this.events.emit("regenerate");
  }

  // ========================================================================
  // Serialization methods
  // ========================================================================

  /**
   * Serializes the task and its subtasks into a format that can be stored
   * @returns The serialized task and subtasks
   */
  public toJSON(): JsonTaskItem | TaskGraphItemJson {
    let json = super.toJSON();
    const hasChildren = this.hasChildren();
    if (hasChildren) {
      json = {
        ...json,
        merge: this.compoundMerge,
        subgraph: this.subGraph!.toJSON(),
      };
    }
    return json;
  }

  /**
   * Converts the task to a JSON format suitable for dependency tracking
   * @returns The task and subtasks in JSON thats easier for humans to read
   */
  public toDependencyJSON(): JsonTaskItem {
    const json = this.toJSON();
    if (this.hasChildren()) {
      if ("subgraph" in json) {
        delete json.subgraph;
      }
      return { ...json, subtasks: this.subGraph!.toDependencyJSON() };
    }
    return json;
  }
}
