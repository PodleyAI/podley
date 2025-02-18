//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import { TaskGraphRunner } from "../../task-graph/TaskGraphRunner";
import { Task } from "../../task/Task";
import { SingleTask } from "../../task/SingleTask";
import { DataFlow } from "../../task-graph/DataFlow";
import { TaskGraph } from "../../task-graph/TaskGraph";
import {
  ConvertAllToArrays,
  ConvertSomeToOptionalArray,
  arrayTaskFactory,
} from "../../task/ArrayTask";

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
  input: number[];
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
      id: "input",
      name: "Input",
      valueType: "number",
      isArray: true,
      defaultValue: [0],
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
    const inputs = Array.isArray(this.runInputData.input)
      ? this.runInputData.input
      : [this.runInputData.input ?? 0];
    return { output: inputs.reduce((acc, cur) => acc + cur, 0) };
  }
}

export const TestSquareMultiInputTask = arrayTaskFactory<
  ConvertSomeToOptionalArray<TestSquareTaskInput, "input">,
  ConvertAllToArrays<TestSquareTaskOutput>
>(TestSquareTask, ["input"]);

describe("TaskGraphRunner", () => {
  let runner: TaskGraphRunner;
  let graph: TaskGraph;
  let nodes: Task[];

  beforeEach(() => {
    graph = new TaskGraph();
    nodes = [
      new TestSquareMultiInputTask({ id: "task1", input: { input: [6, 7] } }),
      new TestSquareTask({ id: "task2", input: { input: 5 } }),
      new TestDoubleTask({ id: "task3", input: { input: 5 } }),
    ];
    graph.addTasks(nodes);
    runner = new TaskGraphRunner(graph);
  });

  describe("runGraph array input", () => {
    it("should be able to have multiple inputs for array input type", async () => {
      const nodeRunSpy = spyOn(nodes[0], "run");

      const results = await runner.runGraph();
      expect(nodeRunSpy).toHaveBeenCalledTimes(1);
      expect(results[2]).toEqual({ output: [36, 49] });
    });

    it("array input into ArrayTask", async () => {
      const task = new TestSquareMultiInputTask({ id: "task4" });
      graph.addTask(task);
      graph.addDataFlow(new DataFlow("task2", "output", "task4", "input"));
      graph.addDataFlow(new DataFlow("task3", "output", "task4", "input"));

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
});
