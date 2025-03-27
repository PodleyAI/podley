//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventEmitter, type EventParameters } from "@ellmers/util";
import type { TaskOutputRepository } from "../storage/TaskOutputRepository";
import type { ITask, ITaskConstructor } from "../task/ITask";
import { Task } from "../task/Task";
import { WorkflowError } from "../task/TaskError";
import type { JsonTaskItem, TaskGraphJson } from "../task/TaskJSON";
import { TaskConfig, TaskOutput, type TaskInput } from "../task/TaskTypes";
import { Dataflow, DATAFLOW_ALL_PORTS } from "./Dataflow";
import { TaskGraph } from "./TaskGraph";
import { CompoundMergeStrategy } from "./TaskGraphRunner";
import { TSchema } from "@sinclair/typebox";

// Type definitions for the workflow
export type CreateWorkflow<
  I extends TaskInput,
  EO extends TaskOutput,
  C extends TaskConfig,
  RI extends TaskInput = I,
  RO extends TaskOutput = EO,
> = (input?: Partial<RI>, config?: Partial<C>) => Workflow;

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
export class Workflow {
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
    EI extends TaskInput,
    EO extends TaskOutput,
    C extends TaskConfig = TaskConfig,
    RI extends TaskInput = EI,
    RO extends TaskOutput = EO,
  >(taskClass: ITaskConstructor<EI, EO, C, RI, RO>): CreateWorkflow<RI, RO, C> {
    const helper = function (
      this: Workflow,
      input: Partial<RI> = {},
      config: Partial<C> = {}
    ): Workflow {
      this._error = "";

      // Get the parent node if it exists
      const tasks = this.graph.getTasks();
      const parent = tasks.length > 0 ? tasks[tasks.length - 1] : undefined;

      // Create and add the new task
      taskIdCounter++;

      const task = this.addTask<EI, EO, C, RI, RO>(
        taskClass,
        input as EI,
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

        const makeMatch = (
          comparator: (
            [parentOutputPortId, parentPortOutput]: [string, TSchema],
            [taskInputPortId, taskPortInput]: [string, TSchema]
          ) => boolean
        ): Map<string, string> => {
          for (const [parentOutputPortId, parentPortOutput] of Object.entries(
            parent.outputSchema.properties
          )) {
            for (const [taskInputPortId, taskPortInput] of Object.entries(
              task.inputSchema.properties
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
        makeMatch(
          ([parentOutputPortId, parentPortOutput], [taskInputPortId, taskPortInput]) =>
            parentPortOutput.type === taskPortInput.type && parentOutputPortId === taskInputPortId
        );
        makeMatch(
          ([parentOutputPortId, parentPortOutput], [taskInputPortId, taskPortInput]) =>
            parentPortOutput.type === taskPortInput.type &&
            parentOutputPortId === "output" &&
            taskInputPortId === "input"
        );
        makeMatch(
          ([parentOutputPortId, parentPortOutput], [taskInputPortId, taskPortInput]) =>
            parentPortOutput.type === taskPortInput.type
        );

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
    // @ts-expect-error - runtype is hack from ArrayTask TODO: fix
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
   * @returns The output of the task graph
   */
  public async run() {
    this.events.emit("start");
    this._abortController = new AbortController();

    try {
      const output = await this.graph.run({
        parentSignal: this._abortController.signal,
        parentProvenance: {},
        outputCache: this._repository,
      });
      const last = this.graph.mergeExecuteOutputsToRunOutput(output, "last-or-property-array");
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

  /**
   * Creates a new task graph workflow that runs multiple task graph workflows in parallel
   *
   * @param args - The task graph workflows to run in parallel
   * @returns The current task graph workflow
   */
  public parallel(merge: CompoundMergeStrategy, ...args: Array<(b: Workflow) => void>): Workflow {
    this._error = "";

    const groups = args.map((fn) => {
      const w = new Workflow();
      fn(w);
      return w;
    });

    const groupTask = new Task(
      {},
      {
        isCompound: true,
        compoundMerge: merge,
      }
    );
    groupTask.subGraph?.addTasks(groups.flatMap((w) => w.graph.getTasks()));
    this._graph.addTask(groupTask);

    return this;
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

  public addTask<
    EI extends TaskInput,
    EO extends TaskOutput,
    C extends TaskConfig = TaskConfig,
    RI extends TaskInput = EI,
    RO extends TaskOutput = EO,
  >(
    taskClass: ITaskConstructor<EI, EO, C, RI, RO>,
    input: EI,
    config: C
  ): ITask<EI, EO, C, RI, RO> {
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
  I extends TaskInput,
  O extends TaskOutput,
  C extends TaskConfig = TaskConfig,
  RI extends TaskInput = I,
  RO extends TaskOutput = O,
>(taskClass: any): CreateWorkflow<I, O, C, RI, RO> {
  return Workflow.createWorkflow<I, O, C, RI, RO>(taskClass);
}
