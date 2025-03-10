//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { beforeEach, describe, expect, it } from "bun:test";
import { DelayTask } from "@ellmers/tasks";
import { TaskStatus, TaskAbortedError } from "@ellmers/task-graph";

describe("DelayTask", () => {
  let task: DelayTask;

  beforeEach(() => {
    task = new DelayTask({ delay: 10 }, { id: "delayed" });
  });

  it("should complete successfully with short delay", async () => {
    // Start the task with a short delay
    const result = await task.run();

    // Verify the task completed successfully
    expect(task.status).toBe(TaskStatus.COMPLETED);
    expect(result).toEqual({});
  });

  it("should pass through input to output", async () => {
    // Create a task with input
    const taskWithInput = new DelayTask(
      { delay: 10, pass_through: { something: "test-value" } },
      {
        id: "delayed-with-input",
      }
    );

    // Run the task
    const result = await taskWithInput.run();

    // Verify the input was passed through to the output
    expect(result).toEqual({ something: "test-value" });
    expect(taskWithInput.status).toBe(TaskStatus.COMPLETED);
    expect(taskWithInput.runOutputData).toEqual({ something: "test-value" });
    expect(result.delay).toBeUndefined(); // we remove this as it could have come from defaults
  });

  it("should handle task abortion", async () => {
    try {
      const resultPromise = task.run();
      task.abort();
      await resultPromise;
    } catch (error) {
      expect(error).toBeInstanceOf(TaskAbortedError);
    }
  });
});
