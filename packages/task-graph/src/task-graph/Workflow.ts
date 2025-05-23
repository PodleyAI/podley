//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter, simplifySchema, type EventParameters } from "@ellmers/util";
import { TObject, TSchema } from "@sinclair/typebox";
import { TaskOutputRepository } from "../storage/TaskOutputRepository";
import { GraphAsTask } from "../task/GraphAsTask";
import type { ITask, ITaskConstructor } from "../task/ITask";
import { Task } from "../task/Task";
import { WorkflowError } from "../task/TaskError";
import type { JsonTaskItem, TaskGraphJson } from "../task/TaskJSON";
import { TaskConfig, TaskIO } from "../task/TaskTypes";
import { getLastTask, parallel, pipe, PipeFunction, Taskish } from "./Conversions";
import { Dataflow, DATAFLOW_ALL_PORTS } from "./Dataflow";
import { IWorkflow } from "./IWorkflow";
import { TaskGraph } from "./TaskGraph";
import { CompoundMergeStrategy } from "./TaskGraphRunner";

// Type definitions for the workflow
export type CreateWorkflow<I extends TaskIO, O extends TaskIO, C extends TaskConfig> = (
  input?: Partial<I>,
  config?: Partial<C>
) => Workflow;

// Event types
export type WorkflowEventListeners = {
  changed: (id: unknown) => void;
  reset: () => void;
  error: (error: string) => void;
  start: () => void;
  complete: () => void;
  abort: (error: string) => void;
};

export type WorkflowEvents = keyof WorkflowEventListeners;
export type WorkflowEventListener<Event extends WorkflowEvents> = WorkflowEventListeners[Event];
export type WorkflowEventParameters<Event extends WorkflowEvents> = EventParameters<
  WorkflowEventListeners,
  Event
>;

// Task ID counter
let taskIdCounter = 0;

/**
 * Class for building and managing a task graph
 * Provides methods for adding tasks, connecting outputs to inputs, and running the task graph
 */
export class Workflow<Input extends TaskIO = TaskIO, Output extends TaskIO = TaskIO>
  implements IWorkflow<Input, Output>
{
  /**
   * Creates a new Workflow
   *
   * @param repository - Optional repository for task outputs
   */
  constructor(repository?: TaskOutputRepository) {
    this._repository = repository;
    this._graph = new TaskGraph({
      outputCache: this._repository,
    });
    this._onChanged = this._onChanged.bind(this);
    this.setupEvents();
  }
  // Private properties
  private _graph: TaskGraph;
  private _dataFlows: Dataflow[] = [];
  private _error: string = "";
  private _repository?: TaskOutputRepository;

  // Abort controller for cancelling task execution
  private _abortController?: AbortController;

  /**
   * Event emitter for task graph events
   */
  public readonly events = new EventEmitter<WorkflowEventListeners>();

  /**
   * Creates a helper function for adding specific task types to a Workflow
   *
   * @param taskClass - The task class to create a helper for
   * @returns A function that adds the specified task type to a Workflow
   */
  public static createWorkflow<
    I extends TaskIO,
    O extends TaskIO,
    C extends TaskConfig = TaskConfig,
  >(taskClass: ITaskConstructor<I, O, C>): CreateWorkflow<I, O, C> {
    const helper = function (
      this: Workflow,
      input: Partial<I> = {},
      config: Partial<C> = {}
    ): Workflow {
      this._error = "";

      const parent = getLastTask(this);

      // Create and add the new task
      taskIdCounter++;

      const task = this.addTask<I, O, C>(
        taskClass,
        input as I,
        { id: String(taskIdCounter), ...config } as C
      );

      // Process any pending data flows
      if (this._dataFlows.length > 0) {
        this._dataFlows.forEach((dataflow) => {
          if (
            task.inputSchema.properties?.[dataflow.targetTaskPortId] === undefined &&
            dataflow.targetTaskPortId !== DATAFLOW_ALL_PORTS
          ) {
            this._error = `Input ${dataflow.targetTaskPortId} not found on task ${task.config.id}`;
            console.error(this._error);
            return;
          }

          dataflow.targetTaskId = task.config.id;
          this.graph.addDataflow(dataflow);
        });

        this._dataFlows = [];
      }

      // Auto-connect to parent if needed
      if (parent && this.graph.getTargetDataflows(parent.config.id).length === 0) {
        // Find matches between parent outputs and task inputs based on valueType
        const matches = new Map<string, string>();
        const sourceSchema = simplifySchema(parent.outputSchema) as TObject;
        const targetSchema = simplifySchema(task.inputSchema) as TObject;

        const makeMatch = (
          comparator: (
            [parentOutputPortId, parentPortOutput]: [string, TSchema],
            [taskInputPortId, taskPortInput]: [string, TSchema]
          ) => boolean
        ): Map<string, string> => {
          for (const [parentOutputPortId, parentPortOutput] of Object.entries(
            sourceSchema.properties
          )) {
            for (const [taskInputPortId, taskPortInput] of Object.entries(
              targetSchema.properties
            )) {
              if (
                !matches.has(taskInputPortId) &&
                comparator([parentOutputPortId, parentPortOutput], [taskInputPortId, taskPortInput])
              ) {
                matches.set(taskInputPortId, parentOutputPortId);
                this.connect(parent.config.id, parentOutputPortId, task.config.id, taskInputPortId);
              }
            }
          }
          return matches;
        };

        // Try to match outputs to inputs using different strategies
        makeMatch(([parentOutputPortId, parentPortOutput], [taskInputPortId, taskPortInput]) => {
          // $id matches
          const idTypeMatch =
            parentPortOutput.$id !== undefined && parentPortOutput.$id === taskPortInput.$id;
          // $id both blank
          const idTypeBlank = parentPortOutput.$id === undefined && undefined === taskPortInput.$id;
          const typeMatch = idTypeBlank && parentPortOutput.type === taskPortInput.type;
          const outputPortIdMatch = parentOutputPortId === taskInputPortId;
          const outputPortIdOutputInput =
            parentOutputPortId === "output" && taskInputPortId === "input";
          const portIdsCompatible = outputPortIdMatch || outputPortIdOutputInput;
          return (idTypeMatch || typeMatch) && portIdsCompatible;
        });

        // If no matches were found, remove the task and report an error
        if (matches.size === 0) {
          this._error =
            `Could not find a match between the outputs of ${parent.type} and the inputs of ${task.type}. ` +
            `You now need to connect the outputs to the inputs via connect() manually before adding this task. Task not added.`;

          console.error(this._error);
          this.graph.removeTask(task.config.id);
        }
      }

      return this;
    };

    // Copy metadata from the task class
    // @ts-expect-error - using internals
    helper.type = taskClass.runtype ?? taskClass.type;
    helper.category = taskClass.category;
    helper.inputSchema = taskClass.inputSchema;
    helper.outputSchema = taskClass.outputSchema;
    helper.cacheable = taskClass.cacheable;
    helper.workflowCreate = true;

    return helper;
  }

  /**
   * Gets the current task graph
   */
  public get graph(): TaskGraph {
    return this._graph;
  }

  /**
   * Sets a new task graph
   */
  public set graph(value: TaskGraph) {
    this._dataFlows = [];
    this._error = "";
    this.clearEvents();
    this._graph = value;
    this.setupEvents();
    this.events.emit("reset");
  }

  /**
   * Gets the current error message
   */
  public get error(): string {
    return this._error;
  }

  /**
   * Event subscription methods
   */
  public on<Event extends WorkflowEvents>(name: Event, fn: WorkflowEventListener<Event>): void {
    this.events.on(name, fn);
  }

  public off<Event extends WorkflowEvents>(name: Event, fn: WorkflowEventListener<Event>): void {
    this.events.off(name, fn);
  }

  public once<Event extends WorkflowEvents>(name: Event, fn: WorkflowEventListener<Event>): void {
    this.events.once(name, fn);
  }

  public waitOn<Event extends WorkflowEvents>(
    name: Event
  ): Promise<WorkflowEventParameters<Event>> {
    return this.events.waitOn(name) as Promise<WorkflowEventParameters<Event>>;
  }

  /**
   * Runs the task graph
   *
   * @param input - The input to the task graph
   * @returns The output of the task graph
   */
  public async run(input: Input = {} as Input) {
    this.events.emit("start");
    this._abortController = new AbortController();

    try {
      const output = await this.graph.run<Output>(input, {
        parentSignal: this._abortController.signal,
        parentProvenance: {},
        outputCache: this._repository,
      });
      const last = this.graph.mergeExecuteOutputsToRunOutput<Output>(
        output,
        "last-or-property-array"
      );
      this.events.emit("complete");
      return last;
    } catch (error) {
      this.events.emit("error", String(error));
      throw error;
    } finally {
      this._abortController = undefined;
    }
  }

  /**
   * Aborts the running task graph
   */
  public async abort(): Promise<void> {
    this._abortController?.abort();
  }

  /**
   * Removes the last task from the task graph
   *
   * @returns The current task graph workflow
   */
  public pop(): Workflow {
    this._error = "";
    const nodes = this._graph.getTasks();

    if (nodes.length === 0) {
      this._error = "No tasks to remove";
      console.error(this._error);
      return this;
    }

    const lastNode = nodes[nodes.length - 1];
    this._graph.removeTask(lastNode.config.id);
    return this;
  }

  /**
   * Converts the task graph to JSON
   *
   * @returns The task graph as JSON
   */
  public toJSON(): TaskGraphJson {
    return this._graph.toJSON();
  }

  /**
   * Converts the task graph to dependency JSON
   *
   * @returns The task graph as dependency JSON
   */
  public toDependencyJSON(): JsonTaskItem[] {
    return this._graph.toDependencyJSON();
  }

  // Replace both the instance and static pipe methods with properly typed versions
  // Pipe method overloads
  public pipe<A extends TaskIO, B extends TaskIO>(fn1: Taskish<A, B>): IWorkflow<A, B>;
  public pipe<A extends TaskIO, B extends TaskIO, C extends TaskIO>(
    fn1: Taskish<A, B>,
    fn2: Taskish<B, C>
  ): IWorkflow<A, C>;
  public pipe<A extends TaskIO, B extends TaskIO, C extends TaskIO, D extends TaskIO>(
    fn1: Taskish<A, B>,
    fn2: Taskish<B, C>,
    fn3: Taskish<C, D>
  ): IWorkflow<A, D>;
  public pipe<
    A extends TaskIO,
    B extends TaskIO,
    C extends TaskIO,
    D extends TaskIO,
    E extends TaskIO,
  >(
    fn1: Taskish<A, B>,
    fn2: Taskish<B, C>,
    fn3: Taskish<C, D>,
    fn4: Taskish<D, E>
  ): IWorkflow<A, E>;
  public pipe<
    A extends TaskIO,
    B extends TaskIO,
    C extends TaskIO,
    D extends TaskIO,
    E extends TaskIO,
    F extends TaskIO,
  >(
    fn1: Taskish<A, B>,
    fn2: Taskish<B, C>,
    fn3: Taskish<C, D>,
    fn4: Taskish<D, E>,
    fn5: Taskish<E, F>
  ): IWorkflow<A, F>;
  public pipe(...args: Taskish<TaskIO, TaskIO>[]): IWorkflow {
    return pipe(args as any, this);
  }

  // Static pipe method overloads
  public static pipe<A extends TaskIO, B extends TaskIO>(
    fn1: PipeFunction<A, B> | ITask<A, B>
  ): IWorkflow;
  public static pipe<A extends TaskIO, B extends TaskIO, C extends TaskIO>(
    fn1: PipeFunction<A, B> | ITask<A, B>,
    fn2: PipeFunction<B, C> | ITask<B, C>
  ): IWorkflow;
  public static pipe<A extends TaskIO, B extends TaskIO, C extends TaskIO, D extends TaskIO>(
    fn1: PipeFunction<A, B> | ITask<A, B>,
    fn2: PipeFunction<B, C> | ITask<B, C>,
    fn3: PipeFunction<C, D> | ITask<C, D>
  ): IWorkflow;
  public static pipe<
    A extends TaskIO,
    B extends TaskIO,
    C extends TaskIO,
    D extends TaskIO,
    E extends TaskIO,
  >(
    fn1: PipeFunction<A, B> | ITask<A, B>,
    fn2: PipeFunction<B, C> | ITask<B, C>,
    fn3: PipeFunction<C, D> | ITask<C, D>,
    fn4: PipeFunction<D, E> | ITask<D, E>
  ): IWorkflow;
  public static pipe<
    A extends TaskIO,
    B extends TaskIO,
    C extends TaskIO,
    D extends TaskIO,
    E extends TaskIO,
    F extends TaskIO,
  >(
    fn1: PipeFunction<A, B> | ITask<A, B>,
    fn2: PipeFunction<B, C> | ITask<B, C>,
    fn3: PipeFunction<C, D> | ITask<C, D>,
    fn4: PipeFunction<D, E> | ITask<D, E>,
    fn5: PipeFunction<E, F> | ITask<E, F>
  ): IWorkflow;
  public static pipe(...args: (PipeFunction | ITask)[]): IWorkflow {
    return pipe(args as any, new Workflow());
  }

  public parallel(
    args: (PipeFunction<any, any> | Task)[],
    mergeFn?: CompoundMergeStrategy
  ): IWorkflow {
    return parallel(args, mergeFn ?? "last-or-property-array", this);
  }

  public static parallel(
    args: (PipeFunction<any, any> | ITask)[],
    mergeFn?: CompoundMergeStrategy
  ): IWorkflow {
    return parallel(args, mergeFn ?? "last-or-property-array", new Workflow());
  }

  /**
   * Renames an output of a task to a new target input
   *
   * @param source - The id of the output to rename
   * @param target - The id of the input to rename to
   * @param index - The index of the task to rename the output of, defaults to the last task
   * @returns The current task graph workflow
   */
  public rename(source: string, target: string, index: number = -1): Workflow {
    this._error = "";

    const nodes = this._graph.getTasks();
    if (-index > nodes.length) {
      const errorMsg = `Back index greater than number of tasks`;
      this._error = errorMsg;
      console.error(this._error);
      throw new WorkflowError(errorMsg);
    }

    const lastNode = nodes[nodes.length + index];
    const outputSchema = lastNode.outputSchema;

    if (!outputSchema.properties?.[source] && source !== DATAFLOW_ALL_PORTS) {
      const errorMsg = `Output ${source} not found on task ${lastNode.config.id}`;
      this._error = errorMsg;
      console.error(this._error);
      throw new WorkflowError(errorMsg);
    }

    this._dataFlows.push(new Dataflow(lastNode.config.id, source, undefined, target));
    return this;
  }

  toTaskGraph(): TaskGraph {
    return this._graph;
  }

  toTask(): GraphAsTask {
    const task = new GraphAsTask(
      {},
      {
        compoundMerge: "last-or-property-array",
      }
    );
    task.subGraph = this.toTaskGraph();
    return task;
  }

  /**
   * Resets the task graph workflow to its initial state
   *
   * @returns The current task graph workflow
   */
  public reset(): Workflow {
    taskIdCounter = 0;
    this.clearEvents();
    this._graph = new TaskGraph({
      outputCache: this._repository,
    });
    this._dataFlows = [];
    this._error = "";
    this.setupEvents();
    this.events.emit("changed", undefined);
    this.events.emit("reset");
    return this;
  }

  /**
   * Sets up event listeners for the task graph
   */
  private setupEvents(): void {
    this._graph.on("task_added", this._onChanged);
    this._graph.on("task_replaced", this._onChanged);
    this._graph.on("task_removed", this._onChanged);
    this._graph.on("dataflow_added", this._onChanged);
    this._graph.on("dataflow_replaced", this._onChanged);
    this._graph.on("dataflow_removed", this._onChanged);
  }

  /**
   * Clears event listeners for the task graph
   */
  private clearEvents(): void {
    this._graph.off("task_added", this._onChanged);
    this._graph.off("task_replaced", this._onChanged);
    this._graph.off("task_removed", this._onChanged);
    this._graph.off("dataflow_added", this._onChanged);
    this._graph.off("dataflow_replaced", this._onChanged);
    this._graph.off("dataflow_removed", this._onChanged);
  }

  /**
   * Handles changes to the task graph
   */
  private _onChanged(id: unknown): void {
    this.events.emit("changed", id);
  }

  /**
   * Connects outputs to inputs between tasks
   */
  public connect(
    sourceTaskId: unknown,
    sourceTaskPortId: string,
    targetTaskId: unknown,
    targetTaskPortId: string
  ): Workflow {
    const sourceTask = this.graph.getTask(sourceTaskId);
    const targetTask = this.graph.getTask(targetTaskId);

    if (!sourceTask || !targetTask) {
      throw new WorkflowError("Source or target task not found");
    }

    const sourceSchema = sourceTask.outputSchema;
    const targetSchema = targetTask.inputSchema;

    if (!sourceSchema.properties?.[sourceTaskPortId]) {
      throw new WorkflowError(`Output ${sourceTaskPortId} not found on source task`);
    }

    if (!targetSchema.properties?.[targetTaskPortId]) {
      throw new WorkflowError(`Input ${targetTaskPortId} not found on target task`);
    }

    const dataflow = new Dataflow(sourceTaskId, sourceTaskPortId, targetTaskId, targetTaskPortId);
    this.graph.addDataflow(dataflow);
    return this;
  }

  public addTask<I extends TaskIO, O extends TaskIO, C extends TaskConfig = TaskConfig>(
    taskClass: ITaskConstructor<I, O, C>,
    input: I,
    config: C
  ): ITask<I, O, C> {
    const task = new taskClass(input, config);
    const id = this.graph.addTask(task);
    this.events.emit("changed", id);
    return task;
  }
}

/**
 * Helper function for backward compatibility
 */
export function CreateWorkflow<
  I extends TaskIO,
  O extends TaskIO,
  C extends TaskConfig = TaskConfig,
>(taskClass: any): CreateWorkflow<I, O, C> {
  return Workflow.createWorkflow<I, O, C>(taskClass);
}
