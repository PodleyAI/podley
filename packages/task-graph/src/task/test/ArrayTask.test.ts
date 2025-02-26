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

describe("ArrayTask", () => {
  test("in task mode", async () => {
    const task = new TestSquareMultiInputTask({
      id: "task1",
      input: {
        input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
    });
    const results = await task.run();
    expect(results).toEqual({ output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100] });
  });

  test("in task graph mode", async () => {
    const graph = new TaskGraph();
    graph.addTask(
      new TestSquareMultiInputTask({
        id: "task1",
        input: {
          input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11],
        },
      })
    );
    const runner = new TaskGraphRunner(graph);
    const results = await runner.runGraph();
    expect(results![0][1]).toEqual({ output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 121] });
  });
});
