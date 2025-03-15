//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, test } from "bun:test";
import { TaskGraph, TaskStatus, TaskError, ITask } from "@ellmers/task-graph";
import {
  TestSquareMultiInputTask,
  TestErrorMultiInputTask,
  TestSquareNonReactiveMultiInputTask,
  TestSquareNonReactiveTask,
  TestSquareTaskOutput,
} from "./TestTasks";

describe("ArrayTask", () => {
  test("in task mode reactive run", async () => {
    const task = new TestSquareMultiInputTask(
      {
        input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      {
        id: "task1",
      }
    );
    const results = await task.run();
    expect(results).toEqual({ output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100] });
  });

  test("in task mode reactive runReactive", async () => {
    const task = new TestSquareMultiInputTask(
      {
        input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      {
        id: "task1",
      }
    );
    const results = await task.runReactive();
    expect(results).toEqual({ output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100] });
  });

  test("in task mode reactive run with single", async () => {
    const task = new TestSquareNonReactiveTask({ input: 5 });
    const results = await task.run();
    expect(results).toEqual({ output: 25 });
  });

  test("in task mode reactive runReactive single", async () => {
    const task = new TestSquareNonReactiveTask({ input: 5 });
    const results = await task.runReactive();
    expect(results).toEqual({} as TestSquareTaskOutput);
  });

  test("in task mode non-reactive run", async () => {
    const task = new TestSquareNonReactiveMultiInputTask(
      {
        input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      {
        id: "task1",
      }
    );
    const results = await task.run();
    expect(results).toEqual({ output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100] });
  });

  test("in task mode non-reactive runReactive", async () => {
    const task = new TestSquareNonReactiveMultiInputTask(
      {
        input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      {
        id: "task1",
      }
    );
    const results = await task.runReactive();
    expect(results).toEqual({} as any);
  });

  test("in task graph mode, single result no array children", async () => {
    const graph = new TaskGraph();
    graph.addTask(
      new TestSquareMultiInputTask(
        {
          input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11],
        },
        {
          id: "task1",
        }
      )
    );
    const results = await graph.run();
    expect(results).toEqual({ output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 121] });
  });

  test("emits events correctly", async () => {
    // Create a task with a smaller array for testing events
    const task = new TestSquareMultiInputTask(
      {
        input: [1, 2, 3],
      },
      {
        id: "event-test-task",
      }
    );

    // Create event tracking variables
    const events: Record<string, number> = {
      start: 0,
      progress: 0,
      complete: 0,
    };

    // Set up event listeners
    task.on("start", () => {
      events.start++;
      expect(task.status).toBe(TaskStatus.PROCESSING);
    });

    task.on("progress", (progress: number) => {
      events.progress++;
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    task.on("complete", () => {
      events.complete++;
      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.completedAt).toBeDefined();
    });

    // Manually trigger progress events
    const runner = task.runner;
    // @ts-expect-error ts(2445)
    runner.handleStart();
    // @ts-expect-error ts(2445)
    runner.handleProgress(0.5);

    // Run the task
    const results = await task.run();

    // Verify events were emitted
    expect(events.start).toBeGreaterThanOrEqual(1);
    expect(events.progress).toBeGreaterThanOrEqual(1);
    expect(events.complete).toBe(1);

    // Verify the task completed successfully
    expect(results).toEqual({ output: [1, 4, 9] });
    expect(task.runOutputData).toEqual({ output: [1, 4, 9] });
  });

  test("child tasks emit events that bubble up to parent", async () => {
    // Create a task with a smaller array for testing events
    const task = new TestSquareMultiInputTask(
      {
        input: [1, 2],
      },
      {
        id: "event-bubbling-test",
      }
    );

    // Create event tracking variables for parent and children
    const parentEvents: Record<string, number> = {
      start: 0,
      progress: 0,
      complete: 0,
    };

    const childEvents: Record<string, number> = {
      start: 0,
      progress: 0,
      complete: 0,
    };

    // Set up event listeners on parent task
    task.on("start", () => {
      parentEvents.start++;
    });

    task.on("progress", () => {
      parentEvents.progress++;
    });

    task.on("complete", () => {
      parentEvents.complete++;
    });

    // After task is created, we can access its subGraph and child tasks
    task.regenerateGraph();

    // Set up event listeners on child tasks
    task.subGraph!.getTasks().forEach((childTask: ITask) => {
      childTask.on("start", () => {
        childEvents.start++;
      });

      childTask.on("progress", () => {
        childEvents.progress++;
      });

      childTask.on("complete", () => {
        childEvents.complete++;
      });
    });

    // Manually trigger progress events via the runner
    const runner = task._runner || (task as any).runner;
    // @ts-expect-error - calling protected method for testing
    runner.handleStart();
    // @ts-expect-error - calling protected method for testing
    runner.handleProgress(0.5);

    // Manually trigger progress events on child tasks
    task.subGraph!.getTasks().forEach((childTask: ITask) => {
      // @ts-expect-error - accessing protected property for testing
      const childRunner = childTask._runner || (childTask as any).runner;
      childRunner.handleStart();
      childRunner.handleProgress(0.5);
    });

    // Run the task
    await task.run();

    // Verify parent events were emitted
    expect(parentEvents.start).toBeGreaterThanOrEqual(1);
    expect(parentEvents.progress).toBeGreaterThanOrEqual(1);
    expect(parentEvents.complete).toBe(1);

    // Verify child events were emitted
    expect(childEvents.start).toBeGreaterThanOrEqual(2); // At least one for each child task
    expect(childEvents.progress).toBeGreaterThanOrEqual(2); // At least one for each child task
    expect(childEvents.complete).toBe(2); // One for each child task
  });

  test("handles errors correctly", async () => {
    // Create a task with inputs that will cause an error
    const task = new TestErrorMultiInputTask(
      {
        input: [1, 2, 3], // The value 2 will cause an error
      },
      {
        id: "error-test-task",
      }
    );

    // Create event tracking variables
    const events: Record<string, number> = {
      start: 0,
      progress: 0,
      error: 0,
      complete: 0,
    };

    // Set up event listeners
    task.on("start", () => {
      events.start++;
    });

    task.on("progress", () => {
      events.progress++;
    });

    task.on("error", (error: TaskError) => {
      events.error++;
      expect(error).toBeDefined();
      expect(error.message).toContain("Test error");
    });

    task.on("complete", () => {
      events.complete++;
    });

    // Manually trigger a progress event
    // Access the runner to trigger lifecycle methods
    const taskRunner = task._runner || (task as any).runner;
    // @ts-expect-error - calling protected method for testing
    taskRunner.handleStart();
    // @ts-expect-error - calling protected method for testing
    taskRunner.handleProgress(0.5);

    // Run the task and catch the error
    try {
      await task.run();
    } catch (error) {
      // Expected error
      expect(error).toBeDefined();
    }

    // Verify events were emitted
    expect(events.start).toBeGreaterThanOrEqual(1);
    expect(events.progress).toBeGreaterThanOrEqual(1);
    expect(events.error).toBeGreaterThanOrEqual(1);

    // The complete event should not be emitted when there's an error
    expect(events.complete).toBe(0);

    // Verify the task status is ERROR
    expect(task.status).toBe(TaskStatus.FAILED);
    expect(task.error).toBeDefined();
  });
});
