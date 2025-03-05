//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { RunOrReplicateTask } from "../RunOrReplicateTask";
import { IExecuteConfig, ITask } from "../ITask";
import {
  TaskInput,
  TaskInputDefinition,
  TaskOutput,
  TaskOutputDefinition,
  TaskStatus,
} from "../TaskTypes";
import { describe, expect, spyOn, test } from "bun:test";
import { TaskGraph } from "../../task-graph/TaskGraph";

// Define our input and output types
interface MultiplyInput extends TaskInput {
  a: number | number[];
  b: number | number[];
}

interface MultiplyOutput extends TaskOutput {
  result: number | number[];
}

/**
 * Create a task that multiplies two numbers
 * This is a direct subclass of RunOrReplicate
 */
class MultiplyRunTask extends RunOrReplicateTask<MultiplyInput, MultiplyOutput> {
  public static readonly inputs: readonly TaskInputDefinition[] = [
    {
      id: "a",
      name: "First Number",
      valueType: "number",
      isArray: "replicate", // This can be a single number or an array of numbers
    },
    {
      id: "b",
      name: "Second Number",
      valueType: "number",
      isArray: "replicate", // This can be a single number or an array of numbers
    },
  ];
  public static readonly outputs: readonly TaskOutputDefinition[] = [
    {
      id: "result",
      name: "Result",
      valueType: "number",
      isArray: "replicate", // The result can be a single number or an array
    },
  ];
  protected async execute(input: MultiplyInput, config: IExecuteConfig): Promise<MultiplyOutput> {
    // Simple multiplication - at this point, we know the inputs are not arrays
    return {
      result: (input.a as number) * (input.b as number),
    };
  }
}
/**
 * Create a task that multiplies two numbers
 * This is a direct subclass of RunOrReplicate
 */
class MultiplyRunReactiveTask extends RunOrReplicateTask<MultiplyInput, MultiplyOutput> {
  public static readonly inputs: readonly TaskInputDefinition[] = [
    {
      id: "a",
      name: "First Number",
      valueType: "number",
      isArray: "replicate", // This can be a single number or an array of numbers
    },
    {
      id: "b",
      name: "Second Number",
      valueType: "number",
      isArray: "replicate", // This can be a single number or an array of numbers
    },
  ];
  public static readonly outputs: readonly TaskOutputDefinition[] = [
    {
      id: "result",
      name: "Result",
      valueType: "number",
      isArray: "replicate", // The result can be a single number or an array
    },
  ];
  protected async executeReactive(
    input: MultiplyInput,
    output: MultiplyOutput
  ): Promise<MultiplyOutput> {
    // Simple multiplication - at this point, we know the inputs are not arrays
    return {
      result: (input.a as number) * (input.b as number),
    };
  }
}

interface SquareInput extends TaskInput {
  a: number | number[];
}
interface SquareOutput extends TaskOutput {
  result: number | number[];
}
/**
 * Create a task that squares a number
 * This is a direct subclass of RunOrReplicate
 */
class SquareRunTask extends RunOrReplicateTask<SquareInput, SquareOutput> {
  public static readonly inputs: readonly TaskInputDefinition[] = [
    {
      id: "a",
      name: "First Number",
      valueType: "number",
      isArray: "replicate", // This can be a single number or an array of numbers
    },
  ];

  public static readonly outputs: readonly TaskOutputDefinition[] = [
    {
      id: "result",
      name: "Result",
      valueType: "number",
      isArray: "replicate", // The result can be a single number or an array
    },
  ];

  protected async execute(input: SquareInput, config: IExecuteConfig): Promise<SquareOutput> {
    // Simple multiplication - at this point, we know the inputs are not arrays
    return {
      result: (input.a as number) * (input.a as number),
    };
  }
}
class SquareRunReactiveTask extends RunOrReplicateTask<SquareInput, SquareOutput> {
  public static readonly inputs: readonly TaskInputDefinition[] = [
    {
      id: "a",
      name: "First Number",
      valueType: "number",
      isArray: "replicate", // This can be a single number or an array of numbers
    },
  ];

  public static readonly outputs: readonly TaskOutputDefinition[] = [
    {
      id: "result",
      name: "Result",
      valueType: "number",
      isArray: "replicate", // The result can be a single number or an array
    },
  ];

  protected async executeReactive(input: SquareInput, output: SquareOutput): Promise<SquareOutput> {
    // Simple multiplication - at this point, we know the inputs are not arrays
    return {
      result: (input.a as number) * (input.a as number),
    };
  }
}

describe("RunOrReplicate", () => {
  test.only("in task mode run plain", async () => {
    const task = new MultiplyRunTask({
      a: 4,
      b: 5,
    });
    // @ts-expect-error - we are testing the protected method
    const executeGraphSpy = spyOn(task, "executeGraph");
    const results = await task.run();
    expect(results).toEqual({ result: 20 });
    expect(executeGraphSpy).not.toHaveBeenCalled();
  });

  test("in task mode run array", async () => {
    const task = new MultiplyRunTask({
      a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      b: 1,
    });
    // @ts-expect-error - we are testing the protected method
    const executeGraphSpy = spyOn(task, "executeGraph");
    const results = await task.run();
    expect(results).toEqual({ result: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
    expect(executeGraphSpy).toHaveBeenCalled();
  });
  test("in task mode run array x array", async () => {
    const task = new MultiplyRunTask({
      a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      b: [1, 2],
    });
    const results = await task.run();
    expect(results).toEqual({
      result: [0, 0, 1, 2, 2, 4, 3, 6, 4, 8, 5, 10, 6, 12, 7, 14, 8, 16, 9, 18, 10, 20],
    });
  });
  test("in task mode reactive run", async () => {
    const task = new MultiplyRunTask({
      a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      b: 10,
    });
    {
      const results = await task.runReactive();
      expect(results).toEqual({} as any);
    }
    {
      await task.run();
      const results = await task.runReactive();
      expect(results).toEqual({ result: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] });
    }
  });

  test("in task mode reactive runReactive", async () => {
    const task = new MultiplyRunReactiveTask({
      a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      b: 10,
    });
    const results = await task.runReactive();
    expect(results).toEqual({ result: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] });
  });

  // test("in task mode reactive run with single", async () => {
  //   const task = new TestSquareNonReactiveTask({ input: 5 });
  //   const results = await task.run();
  //   expect(results).toEqual({ output: 25 });
  // });

  // test("in task mode reactive runReactive single", async () => {
  //   const task = new TestSquareNonReactiveTask({ input: 5 });
  //   const results = await task.runReactive();
  //   expect(results).toEqual({} as TestSquareTaskOutput);
  // });

  // test("in task mode non-reactive run", async () => {
  //   const task = new TestSquareNonReactiveMultiInputTask(
  //     {
  //       input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  //     },
  //     {
  //       id: "task1",
  //     }
  //   );
  //   const results = await task.run();
  //   expect(results).toEqual({ result: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100] });
  // });

  test("in task mode non-reactive runReactive", async () => {
    const task = new SquareRunReactiveTask({
      a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    });
    const results = await task.runReactive();
    expect(results).toEqual({ result: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100] });
  });

  test("in task graph mode", async () => {
    const graph = new TaskGraph();
    graph.addTask(
      new MultiplyRunTask({
        a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        b: 11,
      })
    );
    const results = await graph.run();
    expect(results![0].data).toEqual({ result: [0, 11, 22, 33, 44, 55, 66, 77, 88, 99, 110] });
  });

  test("emits events correctly", async () => {
    // Create a task with a smaller array for testing events
    const task = new SquareRunTask({
      a: [1, 2, 3],
    });

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
    // @ts-expect-error - we are testing the protected method
    task.handleStart();
    // @ts-expect-error - we are testing the protected method
    task.handleProgress(0.5);

    // Run the task
    const results = await task.run();

    // Verify events were emitted
    expect(events.start).toBeGreaterThanOrEqual(1);
    expect(events.progress).toBeGreaterThanOrEqual(1);
    expect(events.complete).toBe(1);

    // Verify the task completed successfully
    expect(results).toEqual({ result: [1, 4, 9] });
    expect(task.runOutputData).toEqual({ result: [1, 4, 9] });
  });

  test("child tasks emit events that bubble up to parent", async () => {
    // Create a task with a smaller array for testing events
    const task = new SquareRunTask({
      a: [1, 2],
    });

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
    task.subGraph!.getNodes().forEach((childTask: ITask) => {
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
    // @ts-expect-error - we are testing the protected method
    task.handleStart();
    // @ts-expect-error - we are testing the protected method
    task.handleProgress(0.5);

    // Manually trigger progress events on child tasks
    task.subGraph!.getNodes().forEach((childTask: ITask) => {
      // @ts-expect-error - we are testing the protected method
      childTask.handleStart();
      // @ts-expect-error - we are testing the protected method
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

  // test("handles errors correctly", async () => {
  //   // Create a task with inputs that will cause an error
  //   const task = new TestErrorMultiInputTask(
  //     {
  //       input: [1, 2, 3], // The value 2 will cause an error
  //     },
  //     {
  //       id: "error-test-task",
  //     }
  //   );

  //   // Create event tracking variables
  //   const events: Record<string, number> = {
  //     start: 0,
  //     progress: 0,
  //     error: 0,
  //     complete: 0,
  //   };

  //   // Set up event listeners
  //   task.on("start", () => {
  //     events.start++;
  //   });

  //   task.on("progress", () => {
  //     events.progress++;
  //   });

  //   task.on("error", (error: TaskError) => {
  //     events.error++;
  //     expect(error).toBeDefined();
  //     expect(error.message).toContain("Test error");
  //   });

  //   task.on("complete", () => {
  //     events.complete++;
  //   });

  //   // Manually trigger a progress event
  //   task.handleStart();
  //   task.handleProgress(0.5);

  //   // Run the task and catch the error
  //   try {
  //     await task.run();
  //   } catch (error) {
  //     // Expected error
  //     expect(error).toBeDefined();
  //   }

  //   // Verify events were emitted
  //   expect(events.start).toBeGreaterThanOrEqual(1);
  //   expect(events.progress).toBeGreaterThanOrEqual(1);
  //   expect(events.error).toBeGreaterThanOrEqual(1);

  //   // The complete event should not be emitted when there's an error
  //   expect(events.complete).toBe(0);

  //   // Verify the task status is ERROR
  //   expect(task.status).toBe(TaskStatus.FAILED);
  //   expect(task.error).toBeDefined();
  // });
});
