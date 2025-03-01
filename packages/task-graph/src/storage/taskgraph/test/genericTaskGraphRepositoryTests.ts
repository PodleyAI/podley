//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { expect, it, beforeEach } from "bun:test";
import { TaskGraphRepository } from "../TaskGraphRepository";
import { Dataflow } from "../../../task-graph/Dataflow";
import { TaskGraph } from "../../../task-graph/TaskGraph";
import { TaskRegistry } from "../../../task/TaskRegistry";
import { TaskOutput } from "../../../task/TaskTypes";
import { SingleTask } from "../../../task/SingleTask";

class TestTask extends SingleTask {
  static readonly type = "TestTask";
  async runReactive(): Promise<TaskOutput> {
    return {};
  }
}
TaskRegistry.registerTask(TestTask);

export function runGenericTaskGraphRepositoryTests(
  createRepository: () => Promise<TaskGraphRepository>
) {
  let repository: TaskGraphRepository;

  beforeEach(async () => {
    repository = await createRepository();
  });

  it("should initialize the tabularRepository", () => {
    expect(repository.tabularRepository).toBeDefined();
  });

  it("should store and retrieve task graph", async () => {
    const id: string = "g1";
    const graph = new TaskGraph();
    const tasks = [
      new TestTask({ id: "task1" }),
      new TestTask({ id: "task2" }),
      new TestTask({ id: "task3" }),
    ];
    const edges: Dataflow[] = [
      new Dataflow("task1", "output1", "task2", "input1"),
      new Dataflow("task2", "output2", "task3", "input2"),
    ];

    graph.addTasks(tasks);
    graph.addDataflows(edges);

    expect(graph.getDataflow("task1.output1 -> task2.input1")).toBeDefined();
    expect(graph.getDataflow("task2.output2 -> task3.input2")).toBeDefined();

    await repository.saveTaskGraph(id, graph);
    const retrievedGraph = await repository.getTaskGraph(id);

    expect(retrievedGraph?.toJSON()).toEqual(graph?.toJSON());
  });

  it("should return undefined for non-existent task graph", async () => {
    const id: string = "g2";

    const retrievedGraph = await repository.getTaskGraph(id);

    expect(retrievedGraph).toBeUndefined();
  });
}
