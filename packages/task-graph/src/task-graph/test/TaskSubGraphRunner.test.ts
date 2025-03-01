//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import { sleep } from "@ellmers/util";
import { Dataflow } from "../Dataflow";
import { TaskGraph } from "../TaskGraph";
import { GraphResult, TaskGraphRunner } from "../TaskGraphRunner";
import {
  ConvertAllToArrays,
  ConvertSomeToOptionalArray,
  arrayTaskFactory,
} from "../../task/ArrayTask";
import { SingleTask } from "../../task/SingleTask";
import { Task, TaskOutput, TaskStatus } from "../../task/TaskTypes";
import { TaskAbortedError, TaskErrorGroup, TaskFailedError } from "../../task/TaskError";

type TestSquareTaskInput = {
  input: number;
};
type TestSquareTaskOutput = {
  output: number;
};
class TestSquareTask extends SingleTask {
  static readonly type = "TestSquareTask";
  declare runInputData: TestSquareTaskInput;
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

export const TestSquareMultiInputTask = arrayTaskFactory<
  ConvertSomeToOptionalArray<TestSquareTaskInput, "input">,
  ConvertAllToArrays<TestSquareTaskOutput>
>(TestSquareTask, ["input"]);

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

// Constants for error messages
const FAILURE_MESSAGE = "Task failed intentionally" as const;
const ABORT_MESSAGE = "Task aborted intentionally" as const;

class FailingTask extends SingleTask {
  static readonly type = "FailingTask";
  declare runInputData: { in: number };
  declare runOutputData: { out: number };
  static inputs = [
    {
      id: "in",
      name: "Input",
      valueType: "number",
      defaultValue: 0,
    },
  ] as const;
  static outputs = [
    {
      id: "out",
      name: "Output",
      valueType: "number",
    },
  ] as const;

  async runFull(): Promise<{ out: number }> {
    // Add a small delay to ensure abortion has time to take effect
    await sleep(5);
    if (this.abortController?.signal.aborted) {
      throw new TaskAbortedError(ABORT_MESSAGE);
    }
    throw new TaskFailedError(FAILURE_MESSAGE);
  }
}

describe("TaskSubGraphRunner", () => {
  let runner: TaskGraphRunner;
  let graph: TaskGraph;

  beforeEach(() => {
    graph = new TaskGraph();
    runner = new TaskGraphRunner(graph);
  });

  describe("runGraph array input", () => {
    let nodes: Task[];
    beforeEach(() => {
      nodes = [
        new TestSquareMultiInputTask({ id: "task0", input: { input: [6, 7] } }),
        new TestSquareTask({ id: "task1", input: { input: 5 } }),
        new TestDoubleTask({ id: "task2", input: { input: 5 } }),
      ];
      graph.addTasks(nodes);
    });

    it("should be able to have multiple inputs for array input type", async () => {
      const nodeRunSpy = spyOn(nodes[0], "run");

      const results = await runner.runGraph();
      expect(nodeRunSpy).toHaveBeenCalledTimes(1);
      expect(results?.find((r) => r.id === "task0")?.data).toEqual({ output: [36, 49] });
    });

    it("array input into ArrayTask", async () => {
      const task = new TestSquareMultiInputTask({ id: "task3" });
      graph.addTask(task);
      graph.addDataflow(new Dataflow("task1", "output", "task3", "input"));
      graph.addDataflow(new Dataflow("task2", "output", "task3", "input"));

      const nodeRunSpy = spyOn(task, "run");

      const results1 = await runner.runGraph();
      const results2 = await runner.runGraph();
      const results3 = await runner.runGraph();

      expect(nodeRunSpy).toHaveBeenCalledTimes(3);
      // different runs should return the same results
      expect(results1[0]).toEqual(results2[0]);
      expect(results2[0]).toEqual(results3[0]);
      expect(results1[1]).toEqual(results2[1]);
      expect(results2[1]).toEqual(results3[1]);
      expect(results1[2]).toEqual(results2[2]);
      expect(results2[2]).toEqual(results3[2]);
    });
  });

  describe("error handling", () => {
    it("should handle task failure", async () => {
      const failingTask = new FailingTask({ id: "failingTaskId" });
      graph.addTask(failingTask);

      let error: TaskErrorGroup | undefined;
      let result: GraphResult | undefined;
      try {
        result = await runner.runGraph();
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(error).toBeInstanceOf(TaskErrorGroup);
      expect(error?.getError("failingTaskId")?.name).toBe(TaskFailedError.name);
      expect(failingTask.status).toBe(TaskStatus.FAILED);
      expect(failingTask.error?.message).toBe(FAILURE_MESSAGE);
    });

    it("should handle task failure in a chain", async () => {
      const squareTask = new TestSquareTask({ id: "square", input: { input: 5 } });
      const failingTask = new FailingTask({ id: "failing" });
      graph.addTasks([squareTask, failingTask]);
      graph.addDataflow(new Dataflow("square", "output", "failing", "input"));

      let error: TaskErrorGroup | undefined;
      try {
        await runner.runGraph();
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(error).toBeInstanceOf(TaskErrorGroup);
      expect(error?.getError("failing")?.name).toBe(TaskFailedError.name);
      expect(squareTask.status).toBe(TaskStatus.COMPLETED);
      expect(failingTask.status).toBe(TaskStatus.FAILED);
      expect(failingTask.error?.message).toBe(FAILURE_MESSAGE);
    });

    it("should handle multiple task failures", async () => {
      const failingTask1 = new FailingTask({ id: "failing1" });
      const failingTask2 = new FailingTask({ id: "failing2" });
      graph.addTasks([failingTask1, failingTask2]);
      graph.addDataflow(new Dataflow("failing1", "out", "failing2", "in"));

      let error: TaskErrorGroup | undefined;
      try {
        await runner.runGraph();
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(error).toBeInstanceOf(TaskErrorGroup);
      expect(error?.getError("failing1")?.name).toBe(TaskFailedError.name);
      expect(error?.getError("failing2")?.name).toBeUndefined();
      expect(failingTask1.status).toBe(TaskStatus.FAILED);
      expect(failingTask2.status).toBe(TaskStatus.PENDING); // failer before it started
      expect(failingTask1.error?.message).toBe(FAILURE_MESSAGE);
    });
  });

  describe("abort handling", () => {
    it("should handle task aborting immediately", async () => {
      const abortingTask = new FailingTask({ id: "abortingTaskId" });
      graph.addTask(abortingTask);

      let error: TaskErrorGroup | undefined;
      let result: GraphResult | undefined;
      try {
        const resultPromise = runner.runGraph();
        runner.abort();
        result = await resultPromise;
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(error).toBeInstanceOf(TaskErrorGroup);
      expect(abortingTask.status).toBe(TaskStatus.PENDING); // no delay, so it should not have started
    });

    it("should handle task aborting after a delay", async () => {
      const abortingTask = new FailingTask({ id: "abortingTaskId" });
      graph.addTask(abortingTask);

      let error: TaskErrorGroup | undefined;
      let result: GraphResult | undefined;
      try {
        const resultPromise = runner.runGraph();
        await sleep(1);
        runner.abort();
        result = await resultPromise;
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(error?.getError("abortingTaskId")?.name).toBe(TaskAbortedError.name);
      expect(abortingTask.status).toBe(TaskStatus.ABORTING);
    });

    it("should handle task aborting in a chain, immediate abort", async () => {
      const squareTask = new TestSquareTask({ id: "square", input: { input: 5 } });
      const failingTask = new FailingTask({ id: "failing" });
      graph.addTasks([squareTask, failingTask]);
      graph.addDataflow(new Dataflow("square", "output", "failing", "in"));

      let error: TaskErrorGroup | undefined;
      try {
        const resultPromise = runner.runGraph();
        runner.abort();
        await resultPromise;
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(squareTask.status).toBe(TaskStatus.PENDING);
      expect(failingTask.status).toBe(TaskStatus.PENDING);
      expect(error?.hasAbortError()).toBe(true);
    });

    it("should handle task aborting in a chain, delayed abort", async () => {
      const squareTask = new TestSquareTask({ id: "square", input: { input: 5 } });
      const failingTask = new FailingTask({ id: "failing" });
      graph.addTasks([squareTask, failingTask]);
      graph.addDataflow(new Dataflow("square", "output", "failing", "in"));

      let error: TaskErrorGroup | undefined;
      try {
        const resultPromise = runner.runGraph();
        await sleep(1);
        runner.abort();
        await resultPromise;
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(squareTask.status).toBe(TaskStatus.COMPLETED);
      expect(failingTask.status).toBe(TaskStatus.ABORTING);
      expect(error?.hasAbortError()).toBe(true);
    });

    it("should handle multiple task abortings", async () => {
      const abortingTask1 = new FailingTask({ id: "aborting1" });
      const abortingTask2 = new FailingTask({ id: "aborting2" });
      graph.addTasks([abortingTask1, abortingTask2]);
      graph.addDataflow(new Dataflow("aborting1", "output", "aborting2", "input"));

      let error: Error | undefined;
      try {
        const resultPromise = runner.runGraph();
        await sleep(1);
        runner.abort();
        await resultPromise;
      } catch (err) {
        error = err as Error;
      }
      expect(abortingTask1.status).toBe(TaskStatus.ABORTING);
      expect(abortingTask2.status).toBe(TaskStatus.PENDING);
      expect(abortingTask1.error).toBeInstanceOf(TaskAbortedError);
      expect(abortingTask2.error).toBeUndefined();
    });
  });
});
