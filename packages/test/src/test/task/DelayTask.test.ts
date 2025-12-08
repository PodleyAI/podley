/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskAbortedError, TaskStatus } from "@workglow/task-graph";
import { DelayTask } from "@workglow/tasks";
import { sleep } from "@workglow/util";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const noop = () => {};
const fakeTimers = !!vi.advanceTimersByTimeAsync;
const useFakeTimers = fakeTimers ? vi.useFakeTimers : noop;
const useRealTimers = fakeTimers ? vi.useRealTimers : noop;
const advanceTimersByTimeAsync = fakeTimers ? vi.advanceTimersByTimeAsync : sleep;
const advanceTimersByTime = fakeTimers ? vi.advanceTimersByTime : sleep;

const DELAY_TIME = 10;

describe("DelayTask", () => {
  let task: DelayTask;

  beforeEach(() => {
    useFakeTimers();
    task = new DelayTask({ delay: DELAY_TIME }, { id: "delayed" });
  });

  afterEach(() => {
    useRealTimers();
  });

  it("should complete successfully with short delay", async () => {
    // Start the task with a short delay
    const resultPromise = task.run();
    await advanceTimersByTimeAsync(DELAY_TIME);
    const result = await resultPromise;

    // Verify the task completed successfully
    expect(task.status).toBe(TaskStatus.COMPLETED);
    expect(result).toEqual({});
  });

  it("should pass through input to output", async () => {
    // Create a task with input
    const taskWithInput = new DelayTask(
      { delay: DELAY_TIME, pass_through: { something: "test-value" } },
      {
        id: "delayed-with-input",
      }
    );

    // Run the task
    const resultPromise = taskWithInput.run();
    await advanceTimersByTimeAsync(DELAY_TIME);
    const result = await resultPromise;

    // Verify the input was passed through to the output
    expect(result).toEqual({ something: "test-value" });
    expect(taskWithInput.status).toBe(TaskStatus.COMPLETED);
    expect(taskWithInput.runOutputData).toEqual({ something: "test-value" });
  });

  it("should handle task abortion", async () => {
    try {
      const resultPromise = task.run();
      task.abort();
      advanceTimersByTime(DELAY_TIME);
      await resultPromise;
    } catch (error) {
      expect(error).toBeInstanceOf(TaskAbortedError);
    }
  });
});
