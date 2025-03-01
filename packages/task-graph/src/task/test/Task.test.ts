//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it } from "bun:test";
import { SingleTask } from "../SingleTask";
import { CompoundTask } from "../CompoundTask";
import { TaskGraph } from "../../task-graph/TaskGraph";

type TestTaskInput = {
  key: string;
};
type TestTaskOutput = {
  reactiveOnly: boolean;
  all: boolean;
  key: string;
};
class TestTask extends SingleTask {
  static readonly type = "TestTask";
  declare runInputData: TestTaskInput;
  declare runOutputData: TestTaskOutput;
  static readonly inputs = [
    {
      id: "key",
      name: "Input",
      valueType: "text",
      defaultValue: "",
    },
  ] as const;
  static readonly outputs = [
    {
      id: "reactiveOnly",
      name: "Output",
      valueType: "boolean",
    },
    {
      id: "all",
      name: "Output",
      valueType: "boolean",
    },
    {
      id: "key",
      name: "Output",
      valueType: "text",
    },
  ] as const;
  async runReactive(): Promise<TestTaskOutput> {
    return { all: false, key: this.runInputData.key, reactiveOnly: true };
  }
  async runFull(): Promise<TestTaskOutput> {
    return { all: true, key: this.runInputData.key, reactiveOnly: false };
  }
}

class TestCompoundTask extends CompoundTask {
  declare runInputData: TestTaskInput;
  declare runOutputData: TestTaskOutput;
  static readonly inputs = [
    {
      id: "key",
      name: "Input",
      valueType: "text",
      defaultValue: "",
    },
  ] as const;
  static readonly outputs = [
    {
      id: "reactiveOnly",
      name: "Output",
      valueType: "boolean",
    },
    {
      id: "all",
      name: "Output",
      valueType: "boolean",
    },
    {
      id: "key",
      name: "Output",
      valueType: "text",
    },
  ] as const;
  static readonly type = "TestCompoundTask";
  async runReactive(): Promise<TestTaskOutput> {
    this.runOutputData = { key: this.runInputData.key, all: false, reactiveOnly: true };
    return this.runOutputData;
  }
  async runFull(): Promise<TestTaskOutput> {
    this.runOutputData = { key: this.runInputData.key, all: true, reactiveOnly: false };
    return this.runOutputData;
  }
}

describe("Task", () => {
  describe("SingleTask", () => {
    it("should create with input data and run the task", async () => {
      const input = { key: "value" };
      const task = new TestTask({ input });
      const output = await task.run();
      expect(output).toEqual({ ...input, reactiveOnly: false, all: true });
      expect(task.runInputData).toEqual(input);
    });

    it("should set input data and run the task", async () => {
      const task = new TestTask();
      const input = { key: "value" };
      task.setInput(input);
      const output = await task.run();
      expect(output).toEqual({ ...input, reactiveOnly: false, all: true });
      expect(task.runInputData).toEqual(input);
    });

    it("should run the task reactively", async () => {
      const task = new TestTask();
      const output = await task.runReactive();
      expect(output).toEqual({ key: "", reactiveOnly: true, all: false });
    });
  });

  describe("CompoundTask", () => {
    it("should create a CompoundTask", () => {
      const task = new TestCompoundTask();
      expect(task).toBeInstanceOf(CompoundTask);
    });

    it("should create a subgraph for the CompoundTask", () => {
      const task = new TestCompoundTask();
      const subGraph = task.subGraph;
      expect(subGraph).toBeInstanceOf(TaskGraph);
    });

    it("should set input data and run the task", async () => {
      const input = { key: "value" };
      const task = new TestCompoundTask({ input });
      const output = await task.run();
      expect(output).toEqual({ key: "value", all: true, reactiveOnly: false });
      expect(task.runInputData).toEqual(input);
    });

    it("should run the task synchronously", async () => {
      const task = new TestCompoundTask({ input: { key: "value2" } });
      const output = await task.runReactive();
      expect(output).toEqual({ key: "value2", reactiveOnly: true, all: false });
    });
  });
});
