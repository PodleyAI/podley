//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import { sleep } from "@ellmers/util";
import { SingleTask } from "../../task/SingleTask";
import { TaskAbortedError } from "../../task/TaskError";
import { Task, TaskOutput, TaskStatus } from "../../task/TaskTypes";
import { Dataflow, DataflowArrow } from "../Dataflow";
import { TaskGraph } from "../TaskGraph";
import { TaskGraphRunner } from "../TaskGraphRunner";

class TestTask extends SingleTask {
  static readonly type = "TestTask";
  async runReactive(): Promise<TaskOutput> {
    return {};
  }
}

type TestSquareTaskInput = {
  input: number;
};
type TestSquareTaskOutput = {
  output: number;
};
class TestSquareTask extends SingleTask {
  static readonly type = "TestSquareTask";
  declare runInputData: TestSquareTaskInput;
  declare defaults: Partial<TestSquareTaskInput>;
  declare runOutputData: TestSquareTaskOutput;
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

type TestDoubleTaskInput = {
  input: number;
};
type TestDoubleTaskOutput = {
  output: number;
};
class TestDoubleTask extends SingleTask {
  static readonly type = "TestDoubleTask";
  declare runInputData: TestDoubleTaskInput;
  declare runOutputData: TestDoubleTaskOutput;
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
  async runReactive(): Promise<TestDoubleTaskOutput> {
    return { output: this.runInputData.input * 2 };
  }
}

type TestAddTaskInput = {
  a: number;
  b: number;
};
type TestAddTaskOutput = {
  output: number;
};
class TestAddTask extends SingleTask {
  static readonly type = "TestAddTask";
  declare runInputData: TestAddTaskInput;
  declare runOutputData: TestAddTaskOutput;
  static inputs = [
    {
      id: "a",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
    {
      id: "b",
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
  async runReactive(): Promise<TestAddTaskOutput> {
    const input = this.runInputData;
    return { output: input.a + input.b };
  }
}

describe("TaskGraphRunner", () => {
  let runner: TaskGraphRunner;
  let graph: TaskGraph;
  let nodes: Task[];

  beforeEach(() => {
    graph = new TaskGraph();
    nodes = [
      new TestTask({ id: "task0" }),
      new TestSquareTask({ id: "task1", input: { input: 5 } }),
      new TestDoubleTask({ id: "task2", input: { input: 5 } }),
    ];
    graph.addTasks(nodes);
    runner = new TaskGraphRunner(graph);
  });

  describe("Basic", () => {
    it("should run", async () => {
      const runReactiveSpy = spyOn(nodes[0], "runReactive");

      await runner.runGraphReactive();

      expect(runReactiveSpy).toHaveBeenCalledTimes(1);
    });

    it("should run the graph with results", async () => {
      const results = await runner.runGraph();
      expect(results?.find((r) => r.id === "task1")?.data.output).toEqual(25);
      expect(results?.find((r) => r.id === "task2")?.data.output).toEqual(10);
    });

    it("should run the graph in the correct order with dependencies", async () => {
      const task3 = new TestAddTask({ id: "task3" });
      graph.addTask(task3);
      graph.addDataflow(new Dataflow("task1", "output", "task3", "a"));
      graph.addDataflow(new Dataflow("task2", "output", "task3", "b"));

      const nodeRunSpy = spyOn(task3, "runReactive");

      const results = await runner.runGraph();

      expect(results?.find((r) => r.id === "task3")?.data.output).toEqual(35);
      expect(nodeRunSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Status Dataflow Propagation", () => {
    let errorTask: Task;
    let targetTask: Task;

    beforeEach(() => {
      graph = new TaskGraph();

      const sourceTask = new TestSquareTask({ id: "source", input: { input: 5 } });
      targetTask = new TestDoubleTask({ id: "target" });

      // Create a task that will throw an error
      errorTask = new TestTask({
        id: "error-source",
      });
      errorTask.runReactive = async () => {
        throw new Error("Test error");
      };

      graph.addTasks([sourceTask, targetTask, errorTask]);
      graph.addDataflow(new DataflowArrow("source.output -> target.input"));
      graph.addDataflow(new DataflowArrow("error-source.output -> target.input"));

      runner = new TaskGraphRunner(graph);
    });

    it("should propagate task status to dataflow edges", async () => {
      let runPromise: Promise<TaskOutput[]>;
      let error: Error | undefined;

      try {
        runPromise = runner.runGraph();
        await runPromise;
      } catch (err) {
        error = err as Error;
      }

      const sourceDataflows = graph.getTargetDataflows("source");
      expect(sourceDataflows.length).toBe(1);

      const sourceTask = graph.getNode("source");
      expect(sourceTask).toBeDefined();
      if (sourceTask) {
        expect(sourceTask.status).toBe(TaskStatus.COMPLETED);
        sourceDataflows.forEach((dataflow) => {
          expect(dataflow.status).toBe(sourceTask.status);
        });
      }

      const errorDataflows = graph.getTargetDataflows("error-source");
      expect(errorDataflows.length).toBe(1);
      expect(errorTask.status).toBe(TaskStatus.FAILED);
      expect(errorDataflows[0].status).toBe(errorTask.status);
      expect(error).toBeDefined();
    });

    it("should propagate task error to dataflow edges", async () => {
      expect(runner.runGraph()).rejects.toThrow();

      const dataflows = graph.getTargetDataflows("error-source");
      expect(errorTask.status).toBe(TaskStatus.FAILED);
      expect(dataflows[0].status).toBe(errorTask.status);
      expect(dataflows.length).toBe(1);
      expect(dataflows[0].error).toBeDefined();
      if (dataflows[0].error && errorTask.error) {
        expect(dataflows[0].error).toBe(errorTask.error);
      }
    });

    it("should propagate task abort status to dataflow edges", async () => {
      // Create a graph with a long-running task
      graph = new TaskGraph();
      const longRunningTask = new TestTask({ id: "long-running" });

      // Override the runReactive method to be long-running and check for abort signal
      longRunningTask.runReactive = async () => {
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 1000);
            // Check if we're aborted and clean up
            longRunningTask.abortController?.signal.addEventListener("abort", () => {
              clearTimeout(timeout);
              reject(new TaskAbortedError("Aborted"));
            });
          });
          return { output: "completed" };
        } catch (error) {
          // This should be caught by the task's error handling
          throw error;
        }
      };

      graph.addTask(longRunningTask);
      const abortTargetTask = new TestTask({ id: "abort-target" });
      graph.addTask(abortTargetTask);
      graph.addDataflow(new Dataflow("long-running", "output", "abort-target", "input"));

      runner = new TaskGraphRunner(graph);

      const runPromise = runner.runGraph();
      await sleep(1);
      runner.abort();
      try {
        await runPromise;
      } catch (error) {
        // Expected to fail due to abort
      }
      expect(longRunningTask.status).toBe(TaskStatus.ABORTING);
      const dataflows = graph.getTargetDataflows("long-running");
      expect(dataflows.length).toBe(1);
      expect(dataflows[0].status).toBe(longRunningTask.status);
      expect(dataflows[0].error).toBeDefined();
      expect(dataflows[0].error).toBeInstanceOf(TaskAbortedError);
    });
  });
});
