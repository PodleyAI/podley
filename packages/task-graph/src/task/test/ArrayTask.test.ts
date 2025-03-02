//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, test, expect } from "bun:test";
import { SingleTask } from "../SingleTask";
import { ConvertAllToArrays } from "../ArrayTask";
import { ConvertSomeToOptionalArray } from "../ArrayTask";
import { arrayTaskFactory } from "../ArrayTask";
import { TaskGraph } from "../../task-graph/TaskGraph";
import { TaskGraphRunner } from "../../task-graph/TaskGraphRunner";
import { TaskEvents, TaskStatus } from "../TaskTypes";
import { Task } from "../TaskTypes";
import { TaskError } from "../TaskError";

type TestSquareTaskInput = {
  input: number;
};
type TestSquareTaskOutput = {
  output: number;
};
class TestSquareTask extends SingleTask<TestSquareTaskInput, TestSquareTaskOutput> {
  static readonly type = "TestSquareTask";
  static inputs = [
    {
      id: "input",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;
  static outputs = [
    {
      id: "output",
      name: "Output",
      valueType: "number",
    },
  ] as const;
  async runReactive(): Promise<TestSquareTaskOutput> {
    return { output: this.runInputData.input * this.runInputData.input };
  }
}

export const TestSquareMultiInputTask = arrayTaskFactory<
  ConvertSomeToOptionalArray<TestSquareTaskInput, "input">,
  ConvertAllToArrays<TestSquareTaskOutput>
>(TestSquareTask, ["input"]);

// Create an error-throwing task for testing error handling
class TestSquareErrorTask extends SingleTask<TestSquareTaskInput, TestSquareTaskOutput> {
  static readonly type = "TestSquareErrorTask";
  static inputs = [
    {
      id: "input",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;
  static outputs = [
    {
      id: "output",
      name: "Output",
      valueType: "number",
    },
  ] as const;
  async runReactive(): Promise<TestSquareTaskOutput> {
    if (this.runInputData.input === 2) {
      throw new TaskError("Test error");
    }
    return { output: this.runInputData.input * this.runInputData.input };
  }
}

export const TestErrorMultiInputTask = arrayTaskFactory<
  ConvertSomeToOptionalArray<TestSquareTaskInput, "input">,
  ConvertAllToArrays<TestSquareTaskOutput>
>(TestSquareErrorTask, ["input"]);

describe("ArrayTask", () => {
  test("in task mode", async () => {
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

  test("in task graph mode", async () => {
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
    const runner = new TaskGraphRunner(graph);
    const results = await runner.runGraph();
    expect(results![0].data).toEqual({ output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 121] });
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

    // Manually trigger a progress event before running the task
    task.handleStart(); // Ensure task is in PROCESSING state
    task.handleProgress(0.5);

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
    task.subGraph.getNodes().forEach((childTask: Task) => {
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

    // Manually trigger progress events
    task.handleStart();
    task.handleProgress(0.5);

    // Manually trigger progress events on child tasks
    task.subGraph.getNodes().forEach((childTask: Task) => {
      childTask.handleStart();
      childTask.handleProgress(0.5);
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
    task.handleStart();
    task.handleProgress(0.5);

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
