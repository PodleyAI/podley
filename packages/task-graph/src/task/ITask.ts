import type { EventEmitter } from "@ellmers/util";
import type { TaskGraph } from "../task-graph/TaskGraph";
import type {
  TaskStatus,
  TaskTypeName,
  TaskInput,
  TaskOutput,
  TaskConfig,
  TaskInputDefinition,
  TaskOutputDefinition,
  TaskEventListeners,
  TaskEvents,
  TaskEventListener,
  TaskEventParameters,
  JsonTaskItem,
} from "./TaskTypes";

/**
 * Core interface that all tasks must implement
 */
export interface ITask {
  // Instance properties
  readonly isCompound: boolean;
  readonly config: TaskConfig;
  status: TaskStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;

  // Input/Output definitions
  readonly inputs: TaskInputDefinition[];
  readonly outputs: TaskOutputDefinition[];

  // Runtime data
  defaults: TaskInput;
  runInputData: TaskInput;
  runOutputData: TaskOutput;

  // Event handling
  readonly events: EventEmitter<TaskEventListeners>;
  on<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  off<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  once<Event extends TaskEvents>(name: Event, fn: TaskEventListener<Event>): void;
  emitted<Event extends TaskEvents>(name: Event): Promise<TaskEventParameters<Event>>;
  emit<Event extends TaskEvents>(name: Event, ...args: TaskEventParameters<Event>): void;

  // Core task methods
  run(): Promise<TaskOutput>;
  runReactive(): Promise<TaskOutput>;
  abort(): Promise<void>;

  handleStart(): void;
  handleComplete(): void;
  handleError(err: any): void;
  getProvenance(): TaskInput;
  resetInputData(): void;
  addInputData<T extends TaskInput>(overrides: Partial<T> | undefined): ITask;
  validateItem(valueType: string, item: any): Promise<boolean>;
  validateInputItem(input: Partial<TaskInput>, inputId: keyof TaskInput): Promise<boolean>;
  validateInputData(input: Partial<TaskInput>): Promise<boolean>;
  toJSON(): JsonTaskItem;
  toDependencyJSON(): JsonTaskItem;
}

/**
 * Interface for tasks that can contain subtasks
 */
export interface ICompoundTask extends ITask {
  readonly isCompound: true;
  readonly subGraph: TaskGraph;
}

/**
 * Interface for simple tasks without subtasks
 */
export interface ISimpleTask extends ITask {
  readonly isCompound: false;
}
