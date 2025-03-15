//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import { sleep } from "@ellmers/util";
import {
  Dataflow,
  TaskGraph,
  TaskGraphRunner,
  GraphResult,
  TaskStatus,
  TaskAbortedError,
  TaskErrorGroup,
  TaskFailedError,
  ITask,
  TaskRegistry,
  TaskOutput,
  GraphSingleResult,
} from "@ellmers/task-graph";
import {
  TestSquareTask,
  TestDoubleTask,
  TestAddTask,
  TestSquareMultiInputTask,
  FailingTask,
  LongRunningTask,
  FAILURE_MESSAGE,
} from "../task/TestTasks";

TaskRegistry.all.clear();

describe("TaskSubGraphRunner", () => {
  let runner: TaskGraphRunner;
  let graph: TaskGraph;

  beforeEach(() => {
    graph = new TaskGraph();
    runner = new TaskGraphRunner(graph);
  });

  describe("runGraph array input", () => {
    let nodes: ITask[];
    beforeEach(() => {
      nodes = [
        new TestSquareMultiInputTask({ input: [6, 7] }, { id: "task0" }),
        new TestSquareTask({ input: 5 }, { id: "task1" }),
        new TestDoubleTask({ input: 5 }, { id: "task2" }),
      ];
      graph.addTasks(nodes);
    });

    it("should be able to have multiple inputs for array input type", async () => {
      const results = await runner.runGraph<TaskOutput>();

      expect(results.length).toEqual(3);
      expect(results.find((r: GraphSingleResult<TaskOutput>) => r.id === "task2")?.data).toEqual({
        output: 10,
      });
    });

    it("array input into ArrayTask", async () => {
      const task = new TestSquareMultiInputTask({ input: [6, 7] }, { id: "task3" });
      graph.addTask(task);
      graph.addDataflow(new Dataflow("task1", "output", "task3", "input"));
      graph.addDataflow(new Dataflow("task2", "output", "task3", "input"));

      const results1 = await runner.runGraph<TaskOutput>();
      const results2 = await runner.runGraph<TaskOutput>();
      const results3 = await runner.runGraph<TaskOutput>();
      expect(Array.isArray(results1)).toBe(true);
      expect(Array.isArray(results2)).toBe(true);
      expect(Array.isArray(results3)).toBe(true);
      if (Array.isArray(results1) && Array.isArray(results2) && Array.isArray(results3)) {
        expect(results1[0]).toEqual(results2[0]);
        expect(results2[0]).toEqual(results3[0]);
        expect(results1[1]).toEqual(results2[1]);
        expect(results2[1]).toEqual(results3[1]);
        expect(results1[2]).toEqual(results2[2]);
        expect(results2[2]).toEqual(results3[2]);
      }
    });
  });

  describe("error handling", () => {
    it("should handle task failure", async () => {
      const failingTask = new FailingTask({}, { id: "failingTaskId" });
      graph.addTask(failingTask);

      let error: TaskErrorGroup | undefined;
      let result: GraphResult<TaskOutput> | TaskOutput | undefined;
      try {
        result = await runner.runGraph<TaskOutput>();
      } catch (err) {
        error = err as TaskErrorGroup;
      }

      expect(error).toBeInstanceOf(TaskErrorGroup);
      expect(error?.getError("failingTaskId")?.name).toBe(TaskFailedError.name);
      expect(failingTask.status).toBe(TaskStatus.FAILED);
      expect(failingTask.error?.message).toBe(FAILURE_MESSAGE);
    });

    it("should handle task abortion", async () => {
      const longRunningTask = new LongRunningTask({}, { id: "longRunningTaskId" });
      graph.addTask(longRunningTask);

      let error: TaskErrorGroup | undefined;
      try {
        const resultPromise = runner.runGraph<TaskOutput>();
        await sleep(50);
        runner.abort();
        await resultPromise;
      } catch (err) {
        error = err as TaskErrorGroup;
      }

      expect(error).toBeInstanceOf(TaskErrorGroup);
      expect(error?.getError("longRunningTaskId")?.name).toBe(TaskAbortedError.name);
    });

    it("should handle task failure in a chain", async () => {
      const squareTask = new TestSquareTask({ input: 5 }, { id: "square" });
      const failingTask = new FailingTask({}, { id: "failing" });
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
      const failingTask1 = new FailingTask({}, { id: "failing1" });
      const failingTask2 = new FailingTask({}, { id: "failing2" });
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
      try {
        const resultPromise = runner.runGraph();
        runner.abort();
        await resultPromise;
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(error).toBeInstanceOf(TaskErrorGroup);
      expect(abortingTask.status).toBe(TaskStatus.PENDING); // no delay, so it should not have started
    });

    it("should handle task aborting after a delay", async () => {
      const abortingTask = new FailingTask({}, { id: "abortingTaskId" });
      graph.addTask(abortingTask);

      let error: TaskErrorGroup | undefined;
      try {
        const resultPromise = runner.runGraph<TaskOutput>();
        await sleep(1);
        runner.abort();
        await resultPromise;
      } catch (err) {
        error = err as TaskErrorGroup;
      }
      expect(error?.getError("abortingTaskId")?.name).toBe(TaskAbortedError.name);
      expect(abortingTask.status).toBe(TaskStatus.ABORTING);
    });

    it("should handle task aborting in a chain, immediate abort", async () => {
      const squareTask = new TestSquareTask({ input: 5 }, { id: "square" });
      const failingTask = new FailingTask({}, { id: "failing" });
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
      const squareTask = new TestSquareTask({ input: 5 }, { id: "square" });
      const failingTask = new FailingTask({}, { id: "failing" });
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
      const abortingTask1 = new FailingTask({}, { id: "aborting1" });
      const abortingTask2 = new FailingTask({}, { id: "aborting2" });
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
