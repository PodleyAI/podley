//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach } from "bun:test";
import { SingleTask } from "../SingleTask";
import { TaskStatus } from "../TaskTypes";
import { TaskAbortedError, TaskError } from "../TaskError";

// Define test types
type TestTaskInput = {
  value: string;
};

type TestTaskOutput = {
  processed: boolean;
  result: string;
};

// Create a test implementation of SingleTask
class TestSingleTask extends SingleTask {
  static readonly type = "TestSingleTask";

  // Declare input/output types
  declare runInputData: TestTaskInput;
  declare runOutputData: TestTaskOutput;

  // Define input/output definitions
  static readonly inputs = [
    {
      id: "value",
      name: "Input Value",
      valueType: "text",
      defaultValue: "default",
    },
  ] as const;

  static readonly outputs = [
    {
      id: "processed",
      name: "Processed Flag",
      valueType: "boolean",
    },
    {
      id: "result",
      name: "Result Value",
      valueType: "text",
    },
  ] as const;

  // Override runFull to provide actual implementation
  async runFull(): Promise<TestTaskOutput> {
    this.handleProgress(0.5);
    // Process the input value
    const result = `Processed: ${this.runInputData.value}`;
    return { processed: true, result };
  }

  // Override runReactive to provide reactive implementation
  async runReactive(): Promise<TestTaskOutput> {
    // For testing purposes, just return a different result
    return { processed: false, result: `Reactive: ${this.runInputData.value}` };
  }

  // Method to simulate an error
  async simulateError(): Promise<void> {
    this.handleError(new Error("Test error"));
  }
}

// Create a test implementation of SingleTask with controllable behavior for event testing
class EventTestTask extends SingleTask {
  static readonly type = "EventTestTask";

  // Control flags for testing
  shouldThrowError = false;
  shouldEmitProgress = false;
  progressValue = 0.5;
  delayMs = 0;

  async runFull(): Promise<any> {
    if (this.shouldEmitProgress) {
      this.handleProgress(this.progressValue);
    }

    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.shouldThrowError) {
      throw new Error("Controlled test error");
    }

    return { success: true };
  }
}

describe("SingleTask", () => {
  describe("Implementation Tests", () => {
    let task: TestSingleTask;

    beforeEach(() => {
      task = new TestSingleTask();
    });

    describe("Basic functionality", () => {
      it("should have correct type", () => {
        expect(TestSingleTask.type).toBe("TestSingleTask");
      });

      it("should not be a compound task", () => {
        expect(task.isCompound).toBe(false);
      });

      it("should have default input values", () => {
        expect(task.defaults).toEqual({ value: "default" });
      });

      it("should initialize with PENDING status", () => {
        expect(task.status).toBe(TaskStatus.PENDING);
      });
    });

    describe("Task execution", () => {
      it("should run the task with default inputs", async () => {
        const output = await task.run();
        expect(output).toEqual({
          processed: true,
          result: "Processed: default",
        });
        expect(task.status).toBe(TaskStatus.COMPLETED);
      });

      it("should run the task reactively", async () => {
        const output = await task.runReactive();
        expect(output).toEqual({
          processed: false,
          result: "Reactive: default",
        });
      });
    });

    describe("Event handling", () => {
      it("should emit start event when task starts", async () => {
        let startEmitted = false;
        task.on("start", () => {
          startEmitted = true;
        });

        await task.run();
        expect(startEmitted).toBe(true);
      });

      it("should emit complete event when task completes", async () => {
        let completeEmitted = false;
        task.on("complete", () => {
          completeEmitted = true;
        });

        await task.run();
        expect(completeEmitted).toBe(true);
      });

      it("should emit progress event during task execution", async () => {
        let progressValue = 0;
        task.on("progress", (progress) => {
          progressValue = progress;
        });

        await task.run();
        expect(progressValue).toBe(0.5);
      });

      it("should emit error event when task fails", async () => {
        let errorEmitted = false;
        let errorMessage = "";

        task.on("error", (error) => {
          errorEmitted = true;
          errorMessage = error.message;
        });

        await task.simulateError();

        expect(errorEmitted).toBe(true);
        expect(errorMessage).toBe("Test error");
        expect(task.status).toBe(TaskStatus.FAILED);
      });

      it("should emit abort event when task is aborted", async () => {
        let abortEmitted = false;

        task.on("abort", () => {
          abortEmitted = true;
        });

        // Start the task
        const runPromise = task.run();

        // Abort the task
        task.abort();

        // Wait for the task to complete or abort
        await runPromise.catch(() => {});

        expect(abortEmitted).toBe(true);
        expect(task.status).toBe(TaskStatus.ABORTING);
      });

      it("should support once event listener", async () => {
        let callCount = 0;

        task.once("start", () => {
          callCount++;
        });

        await task.run();
        await task.run();

        expect(callCount).toBe(1);
      });

      it("should support off to remove event listener", async () => {
        let callCount = 0;

        const listener = () => {
          callCount++;
        };

        task.on("start", listener);
        await task.run();

        task.off("start", listener);
        await task.run();

        expect(callCount).toBe(1);
      });

      it("should support emitted to wait for events", async () => {
        const runPromise = task.run();
        const completePromise = task.emitted("complete");

        await runPromise;
        await completePromise;

        expect(task.status).toBe(TaskStatus.COMPLETED);
      });
    });

    describe("Task lifecycle", () => {
      it("should update status and timestamps correctly", async () => {
        expect(task.status).toBe(TaskStatus.PENDING);
        expect(task.startedAt).toBeUndefined();
        expect(task.completedAt).toBeUndefined();

        await task.run();

        expect(task.status).toBe(TaskStatus.COMPLETED);
        expect(task.startedAt).toBeInstanceOf(Date);
        expect(task.completedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe("Base Class Tests", () => {
    // Test the SingleTask class directly
    describe("Core properties", () => {
      it("should have the correct type", () => {
        expect(SingleTask.type).toBe("SingleTask");
      });

      it("should be instantiable", () => {
        const task = new SingleTask();
        expect(task).toBeInstanceOf(SingleTask);
      });

      it("should not be a compound task", () => {
        const task = new SingleTask();
        expect(task.isCompound).toBe(false);
      });
    });

    describe("Default implementations", () => {
      let task: SingleTask;

      beforeEach(() => {
        task = new SingleTask();
      });

      it("should have default runFull implementation that returns empty object", async () => {
        const result = await task.runFull();
        expect(result).toEqual({});
      });

      it("should have default runReactive implementation that returns empty object", async () => {
        const result = await task.runReactive();
        expect(result).toEqual({});
      });

      it("should preserve runOutputData between calls", async () => {
        // First call should return empty object
        let result = await task.runFull();
        expect(result).toEqual({});

        // Modify runOutputData
        task.runOutputData = { testKey: "testValue" };

        // Second call should return the modified object
        result = await task.runFull();
        expect(result).toEqual({ testKey: "testValue" });
      });
    });

    describe("Task execution flow", () => {
      let task: SingleTask;

      beforeEach(() => {
        task = new SingleTask();
      });

      it("should call runReactive when run is called", async () => {
        // Create a spy on runReactive
        const originalRunReactive = task.runReactive;
        let runReactiveCalled = false;

        task.runReactive = async () => {
          runReactiveCalled = true;
          return await originalRunReactive.call(task);
        };

        await task.run();
        expect(runReactiveCalled).toBe(true);
      });

      it("should update status during task execution", async () => {
        expect(task.status).toBe(TaskStatus.PENDING);

        const runPromise = task.run();

        // Status should be PROCESSING during execution
        expect(task.status).toBe(TaskStatus.PROCESSING);

        await runPromise;

        // Status should be COMPLETED after execution
        expect(task.status).toBe(TaskStatus.COMPLETED);
      });
    });

    describe("Event propagation", () => {
      let task: SingleTask;

      beforeEach(() => {
        task = new SingleTask();
      });

      it("should emit events in the correct order during execution", async () => {
        const events: string[] = [];

        task.on("start", () => events.push("start"));
        task.on("progress", () => events.push("progress"));
        task.on("complete", () => events.push("complete"));

        // Override runReactive to emit progress
        const originalRunReactive = task.runReactive;
        task.runReactive = async () => {
          task.handleProgress(0.5);
          return await originalRunReactive.call(task);
        };

        await task.run();

        expect(events).toEqual(["start", "progress", "complete"]);
      });

      it("should emit regenerate event and handle it correctly", async () => {
        let regenerateEmitted = false;

        task.on("regenerate", () => {
          regenerateEmitted = true;
        });

        task.emit("regenerate");

        expect(regenerateEmitted).toBe(true);
      });
    });

    describe("Error handling", () => {
      let task: SingleTask;

      beforeEach(() => {
        task = new SingleTask();
      });

      it("should handle errors during execution", async () => {
        // Override runReactive to throw an error
        task.runReactive = async () => {
          throw new Error("Test error");
        };

        let errorEmitted = false;
        task.on("error", () => {
          errorEmitted = true;
        });

        await task.run().catch(() => {});

        expect(errorEmitted).toBe(true);
        expect(task.status).toBe(TaskStatus.FAILED);
        expect(task.error).toBeDefined();
        expect(task.error?.message).toBe("Test error");
      });
    });

    describe("Task configuration", () => {
      it("should accept and use configuration", () => {
        const config = {
          id: "test-id",
          name: "Test Task",
          input: { testKey: "testValue" },
        };

        const task = new SingleTask(config);

        expect(task.config.id).toBe("test-id");
        expect(task.config.name).toBe("Test Task");
        expect(task.defaults).toEqual({ testKey: "testValue" });
      });

      it("should generate an ID if not provided", () => {
        const task = new SingleTask();
        expect(task.config.id).toBeDefined();
      });
    });
  });

  describe("Event Handling Tests", () => {
    let task: EventTestTask;

    beforeEach(() => {
      task = new EventTestTask();
    });

    describe("Basic event emission", () => {
      it("should emit events directly via emit method", () => {
        let eventFired = false;

        task.on("start", () => {
          eventFired = true;
        });

        task.emit("start");
        expect(eventFired).toBe(true);
      });

      it("should support multiple listeners for the same event", () => {
        let count = 0;

        task.on("start", () => {
          count++;
        });
        task.on("start", () => {
          count++;
        });
        task.on("start", () => {
          count++;
        });

        task.emit("start");
        expect(count).toBe(3);
      });
    });

    describe("Event parameters", () => {
      it("should pass error object to error event listeners", async () => {
        let receivedError: TaskError | null = null;

        task.on("error", (error: TaskError) => {
          receivedError = error;
        });

        task.shouldThrowError = true;
        await task.run().catch(() => {});

        expect(receivedError).not.toBeNull();
        expect(receivedError!.message).toBe("Controlled test error");
      });

      it("should pass progress value to progress event listeners", async () => {
        let receivedProgress = 0;

        task.on("progress", (progress: number) => {
          receivedProgress = progress;
        });

        task.shouldEmitProgress = true;
        task.progressValue = 0.75;
        await task.run();

        expect(receivedProgress).toBe(0.75);
      });

      it("should pass abort error to abort event listeners", async () => {
        let receivedError: TaskAbortedError | null = null;

        task.on("abort", (error: TaskAbortedError) => {
          receivedError = error;
        });

        // Set a delay to ensure we have time to abort
        task.delayMs = 50;

        const runPromise = task.run();
        task.abort();

        await runPromise.catch(() => {});

        expect(receivedError).not.toBeNull();
        expect(receivedError).toBeInstanceOf(TaskAbortedError);
      });
    });

    describe("Event timing and order", () => {
      it("should emit events in the expected sequence during successful execution", async () => {
        const events: string[] = [];

        task.on("start", () => events.push("start"));
        task.on("progress", () => events.push("progress"));
        task.on("complete", () => events.push("complete"));

        task.shouldEmitProgress = true;
        await task.run();

        expect(events).toEqual(["start", "progress", "complete"]);
      });

      it("should emit events in the expected sequence during failed execution", async () => {
        const events: string[] = [];

        task.on("start", () => events.push("start"));
        task.on("progress", () => events.push("progress"));
        task.on("error", () => events.push("error"));

        task.shouldEmitProgress = true;
        task.shouldThrowError = true;
        await task.run().catch(() => {});

        expect(events).toEqual(["start", "progress", "error"]);
      });

      it("should emit events in the expected sequence during aborted execution", async () => {
        const events: string[] = [];

        task.on("start", () => events.push("start"));
        task.on("progress", () => events.push("progress"));
        task.on("abort", () => events.push("abort"));

        task.shouldEmitProgress = true;
        task.delayMs = 50;

        const runPromise = task.run();

        // Wait a bit to ensure progress event has time to fire
        await new Promise((resolve) => setTimeout(resolve, 10));

        task.abort();
        await runPromise.catch(() => {});

        expect(events).toEqual(["start", "progress", "abort"]);
      });
    });

    describe("Event promise API", () => {
      it("should resolve emitted promise when event is fired", async () => {
        const emittedPromise = task.emitted("start");
        task.emit("start");

        await expect(emittedPromise).resolves.toEqual([]);
      });

      it("should resolve emitted promise with event parameters", async () => {
        const emittedPromise = task.emitted("progress");
        task.emit("progress", 0.42);

        await expect(emittedPromise).resolves.toEqual([0.42]);
      });

      it("should allow waiting for task completion via events", async () => {
        const runPromise = task.run();
        const completePromise = task.emitted("complete");

        await Promise.all([runPromise, completePromise]);
        expect(task.status).toBe(TaskStatus.COMPLETED);
      });
    });

    describe("Event listener management", () => {
      it("should allow removing specific event listeners", () => {
        let count = 0;

        const listener1 = () => {
          count += 1;
        };
        const listener2 = () => {
          count += 10;
        };

        task.on("start", listener1);
        task.on("start", listener2);

        task.emit("start");
        expect(count).toBe(11);

        // Reset and remove one listener
        count = 0;
        task.off("start", listener1);

        task.emit("start");
        expect(count).toBe(10); // Only listener2 should fire
      });

      it("should execute once listeners only one time", () => {
        let count = 0;

        task.once("start", () => {
          count++;
        });

        task.emit("start");
        expect(count).toBe(1);

        task.emit("start");
        expect(count).toBe(1); // Should still be 1
      });

      it("should allow removing once listeners before they fire", () => {
        let fired = false;

        const listener = () => {
          fired = true;
        };
        task.once("start", listener);

        // Remove before firing
        task.off("start", listener);

        task.emit("start");
        expect(fired).toBe(false);
      });
    });

    describe("Event and task state interaction", () => {
      it("should update task status when start event is emitted during run", async () => {
        expect(task.status).toBe(TaskStatus.PENDING);

        const runPromise = task.run();

        // Status should be updated to PROCESSING
        expect(task.status).toBe(TaskStatus.PROCESSING);

        await runPromise;
      });

      it("should update task status when complete event is emitted", async () => {
        await task.run();
        expect(task.status).toBe(TaskStatus.COMPLETED);
      });

      it("should update task status when error event is emitted", async () => {
        task.shouldThrowError = true;
        await task.run().catch(() => {});
        expect(task.status).toBe(TaskStatus.FAILED);
      });

      it("should update task status when abort event is emitted", async () => {
        task.delayMs = 50;
        const runPromise = task.run();
        task.abort();
        await runPromise.catch(() => {});
        expect(task.status).toBe(TaskStatus.ABORTING);
      });
    });
  });
});
