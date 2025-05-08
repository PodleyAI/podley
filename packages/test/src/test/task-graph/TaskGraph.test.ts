//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach } from "bun:test";
import { TaskGraph, Dataflow, serialGraph } from "@ellmers/task-graph";
import { TestIOTask } from "../task/TestTasks";

describe("TaskGraph", () => {
  let graph = new TaskGraph();
  let tasks: TestIOTask[];

  beforeEach(() => {
    graph = new TaskGraph();
    tasks = [
      new TestIOTask({}, { id: "task1" }),
      new TestIOTask({}, { id: "task2" }),
      new TestIOTask({}, { id: "task3" }),
    ];
  });

  it("should add nodes to the graph", () => {
    graph.addTasks(tasks);

    expect(graph.getTask("task1")).toBeDefined();
    expect(graph.getTask("task2")).toBeDefined();
    expect(graph.getTask("task3")).toBeDefined();
  });

  it("should add edges to the graph", () => {
    const edges: Dataflow[] = [
      new Dataflow("task1", "output1", "task2", "input1"),
      new Dataflow("task2", "output2", "task3", "input2"),
    ];

    graph.addTasks(tasks);
    graph.addDataflows(edges);

    expect(graph.getDataflow("task1[output1] ==> task2[input1]")).toBeDefined();
    expect(graph.getDataflow("task2[output2] ==> task3[input2]")).toBeDefined();
  });

  it("should create a serial graph", () => {
    const inputHandle = "input";
    const outputHandle = "output";

    const expectedDataflows: Dataflow[] = [
      new Dataflow("task1", inputHandle, "task2", outputHandle),
      new Dataflow("task2", inputHandle, "task3", outputHandle),
    ];

    const result = serialGraph(tasks, inputHandle, outputHandle);

    expect(result).toBeInstanceOf(TaskGraph);
    expect(result.getDataflows()).toEqual(expectedDataflows);
  });
});
