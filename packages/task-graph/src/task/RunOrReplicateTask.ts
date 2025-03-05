//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { nanoid } from "nanoid";
import { TaskGraph } from "../task-graph/TaskGraph";
import { Task } from "./Task";
import { IExecuteConfig } from "./ITask";
import {
  TaskConfig,
  TaskInput,
  TaskInputDefinition,
  TaskOutput,
  TaskOutputDefinition,
} from "./TaskTypes";
import { GraphResult } from "../task-graph/TaskGraphRunner";
import { TaskGraphItemJson } from "../node";
import { JsonTaskItem } from "../node";
import { collectPropertyValues } from "@ellmers/util";

/**
 * RunOrReplicate is a compound task that either:
 * 1. Executes directly if all inputs are non-arrays
 * 2. Creates a subGraph with one task instance per array element if any input is an array
 * 3. Creates all combinations if multiple inputs are arrays
 */
export class RunOrReplicateTask<
  Input extends TaskInput = TaskInput,
  Output extends TaskOutput = TaskOutput,
  Config extends TaskConfig = TaskConfig,
> extends Task<Input, Output, Config> {
  /**
   * The type identifier for this task class
   */
  public static type = "RunOrReplicate";

  /**
   * Whether this task has side effects
   */
  public static sideeffects = false;

  /**
   * Whether this task is a compound task (contains subtasks)
   */
  public static readonly isCompound = true;

  /**
   * Input definitions for this task
   * Note: Subclasses should override this with their own specific inputs
   */
  public static inputs: TaskInputDefinition[] = [];

  /**
   * Output definitions for this task
   * Note: Subclasses should override this with their own specific outputs
   */
  public static outputs: TaskOutputDefinition[] = [];

  constructor(defaultInputs?: Partial<Input>, config?: Config) {
    super(defaultInputs, config);
    if (this.execute === RunOrReplicateTask.prototype.execute) {
      // @ts-ignore
      this.execute = (input: Input, config: IExecuteConfig) => undefined;
    } else {
      // @ts-ignore
      this.executeDirectly = this.execute;
      // @ts-ignore
      this.execute = RunOrReplicateTask.prototype.execute;
    }
    if (this.executeReactive === RunOrReplicateTask.prototype.executeReactive) {
      // @ts-ignore
      this.executeReactive = (input: Input, output: Output) => output;
    } else {
      // @ts-ignore
      this.executeReactiveDirectly = this.executeReactive;
      // @ts-ignore
      this.executeReactive = RunOrReplicateTask.prototype.executeReactive;
    }
  }

  /**
   * Regenerates the task subgraph based on input arrays
   */
  public regenerateGraph(): void {
    // Check if any inputs are arrays
    const arrayInputs = new Map<string, any[]>();
    let hasArrayInputs = false;
    for (const inputDef of this.inputs) {
      const inputId = inputDef.id;
      const inputValue = this.runInputData[inputId];

      if (inputDef.isArray === "replicate" && Array.isArray(inputValue) && inputValue.length > 0) {
        arrayInputs.set(inputId, inputValue);
        hasArrayInputs = true;
      }
    }

    // If no array inputs, no need to create a subgraph
    if (!hasArrayInputs) return;

    // Clear the existing subgraph
    this.subGraph = new TaskGraph();

    // Create all combinations of inputs
    const combinations = this.generateCombinations(arrayInputs);

    // Create task instances for each combination
    const tasks = combinations.map((combination) => {
      // Create a new instance of this same class
      const { id, name, ...rest } = this.config;
      const task = new (this.constructor as any)(
        { ...this.defaults, ...combination },
        { ...rest, id: `${id}_${nanoid(8)}` }
      );
      return task;
    });

    // Add tasks to subgraph
    this.subGraph.addTasks(tasks);

    // Emit regenerate event
    super.regenerateGraph();
  }

  /**
   * Generate all combinations of array inputs
   */
  private generateCombinations(arrayInputs: Map<string, any[]>): Input[] {
    // Start with an empty object
    const combinations: Input[] = [{ ...this.runInputData }];

    // For each array input, generate all combinations
    for (const [inputId, values] of arrayInputs.entries()) {
      const newCombinations: Input[] = [];

      // For each existing combination
      for (const combination of combinations) {
        // For each value in the array
        for (const value of values) {
          // Create a new combination with this value
          newCombinations.push({
            ...combination,
            [inputId]: value,
          } as Input);
        }
      }

      // Replace combinations with new ones
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    return combinations;
  }

  private fixInput(input: Input): Input {
    // inputs has turned each property into an array, so we need to flatten the input
    const flattenedInput = Object.entries(input).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        return { ...acc, [key]: value[0] };
      }
      return { ...acc, [key]: value };
    }, {});
    return flattenedInput as Input;
  }

  private fixOutput(results: GraphResult): Output {
    let fixedOutput = {} as Output;
    const outputs = results.map((result: any) => result.data);
    if (outputs.length > 0) {
      const collected = collectPropertyValues<Output>(outputs as Output[]);
      if (Object.keys(collected).length > 0) {
        fixedOutput = collected as unknown as Output;
      }
    }
    return fixedOutput;
  }

  private async executeLocally(input: Input, config: IExecuteConfig): Promise<Output | undefined> {
    // @ts-ignore
    if (this.executeDirectly) {
      // @ts-ignore
      const result = await this.executeDirectly(this.runInputData, config);
      this.runOutputData = result;
    }
    // @ts-ignore
    if (this.executeReactiveDirectly) {
      // @ts-ignore
      return this.executeReactiveDirectly(this.runInputData, config);
    } else {
      return this.runOutputData;
    }
  }

  private async executeGraph(input: Input, config: IExecuteConfig): Promise<Output | undefined> {
    // Run subgraph
    const results = await this.subGraph!.run({
      parentProvenance: config.nodeProvenance || {},
      parentSignal: config.signal,
      outputCache: this.outputCache,
    });
    this.runOutputData = this.fixOutput(results);
    return this.runOutputData as unknown as Output;
  }

  /**
   * Execute the task
   */
  protected async execute(input: Input, config: IExecuteConfig): Promise<Output | undefined> {
    const hasArrayInputs = this.hasChildren();
    if (!hasArrayInputs) {
      this.runInputData = this.fixInput(input);
      return this.executeLocally(this.runInputData, config);
    }
    return this.executeGraph(input, config);
  }

  /**
   * Execute the task reactively
   */
  protected async executeReactive(input: Input, output: Output): Promise<Output | undefined> {
    const hasArrayInputs = this.hasChildren();
    // If no array inputs, execute directly
    if (!hasArrayInputs) {
      this.runInputData = this.fixInput(input);
      // @ts-ignore
      if (this.executeReactiveDirectly) {
        // @ts-ignore
        return this.executeReactiveDirectly(this.runInputData, output);
      } else {
        return output;
      }
    }

    // Run subgraph
    const results = await this.subGraph!.runReactive();
    this.runOutputData = this.fixOutput(results);
    return this.runOutputData as unknown as Output;
  }

  toJSON(): JsonTaskItem {
    const { subgraph, ...result } = super.toJSON() as TaskGraphItemJson;
    return result;
  }

  toDependencyJSON(): JsonTaskItem {
    const { subtasks, ...result } = super.toDependencyJSON() as JsonTaskItem;
    return result;
  }
}
