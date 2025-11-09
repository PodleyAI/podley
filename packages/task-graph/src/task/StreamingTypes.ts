//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { ITask } from "./ITask";
import { StreamingMode } from "./TaskTypes";

/**
 * Type guards and validation functions for streaming tasks
 */

/**
 * Checks if a task is streamable
 * @param task The task to check
 * @returns true if the task supports streaming
 */
export function isStreamableTask(task: ITask): boolean {
  return task.isStreamable();
}

/**
 * Checks if an output value is a streaming output
 * @param output The output value to check
 * @returns true if the output is a streamable type
 */
export function isStreamingOutput(output: unknown): boolean {
  if (typeof output === "string") {
    return true;
  }
  if (Array.isArray(output)) {
    return true;
  }
  if (
    output &&
    typeof output === "object" &&
    (Symbol.asyncIterator in output || "getReader" in output)
  ) {
    return true;
  }
  return false;
}

/**
 * Gets the streaming mode for a task
 * @param task The task to check
 * @returns The streaming mode
 */
export function getStreamingMode(task: ITask): StreamingMode {
  return task.getStreamingMode();
}
