import { DataflowJson } from "@ellmers/task-graph";
import { TaskInput, Provenance } from "./TaskTypes";

// ========================================================================
// JSON Serialization Types
// ========================================================================
/**
 * Represents a single task item in the JSON configuration.
 * This structure defines how tasks should be configured in JSON format.
 */

export type JsonTaskItem = {
  /** Unique identifier for the task */
  id: unknown;

  /** Type of task to create */
  type: string;

  /** Optional display name for the task */
  name?: string;

  /** Input configuration for the task */
  input?: TaskInput;

  /** Defines data flow between tasks */
  dependencies?: {
    /** Input parameter name mapped to source task output */
    [x: string]:
      | {
          /** ID of the source task */
          id: unknown;

          /** Output parameter name from source task */
          output: string;
        }
      | Array<{
          id: unknown;
          output: string;
        }>;
  };

  /** Optional metadata about task origin */
  provenance?: Provenance;

  /** Nested tasks for compound operations */
  subtasks?: JsonTaskItem[];
}; /**
 * Represents a task graph item, which can be a task or a subgraph
 */

export type TaskGraphItemJson = {
  id: unknown;
  type: string;
  name?: string;
  input?: TaskInput;
  provenance?: Provenance;
  subgraph?: TaskGraphJson;
};

export type TaskGraphJson = {
  nodes: TaskGraphItemJson[];
  edges: DataflowJson[];
};
