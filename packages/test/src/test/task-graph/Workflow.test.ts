//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";
import { sleep } from "@ellmers/util";
import {
  NumberTask,
  StringTask,
  TestInputTask,
  TestOutputTask,
  TestSimpleTask,
} from "../task/TestTasks";
import {
  Workflow,
  Task,
  TaskOutputRepository,
  TaskConfig,
  TaskError,
  WorkflowError,
  CreateWorkflow,
} from "@ellmers/task-graph";
const colsoleError = globalThis.console.error;

describe("Workflow", () => {
  let workflow: Workflow;
  let repository: TaskOutputRepository;

  beforeEach(() => {
    workflow = new Workflow();
    globalThis.console.error = () => {};
  });

  afterEach(() => {
    workflow.reset();
    globalThis.console.error = colsoleError;
  });

  describe("constructor", () => {
    it("should create a new workflow instance", () => {
      expect(workflow).toBeInstanceOf(Workflow);
      expect(workflow.graph).toBeDefined();
      expect(workflow.error).toBe("");
    });

    it("should create a workflow with a repository", () => {
      expect(workflow).toBeInstanceOf(Workflow);
      // Repository is private, so we can't directly test it
    });
  });

  describe("createWorkflow", () => {
    it("should create a helper function for adding tasks", () => {
      const addTestTask = CreateWorkflow<{ input: string }, { output: string }, TaskConfig>(
        TestSimpleTask
      );

      expect(addTestTask).toBeInstanceOf(Function);
      // @ts-ignore
      expect(addTestTask.inputs).toEqual(TestSimpleTask.inputs);
      // @ts-ignore
      expect(addTestTask.outputs).toEqual(TestSimpleTask.outputs);
    });

    it("should add a task to the workflow when called", () => {
      const addTestTask = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(TestSimpleTask);

      workflow = addTestTask.call(workflow, { input: "test" });

      expect(workflow.graph.getTasks()).toHaveLength(1);
      expect(workflow.graph.getTasks()[0]).toBeInstanceOf(TestSimpleTask);
    });
  });

  describe("run", () => {
    it("should run the task graph and return output", async () => {
      workflow = workflow.TestSimpleTask({ input: "test" });

      const startSpy = spyOn(workflow.events, "emit");
      const result = await workflow.run();

      expect(startSpy).toHaveBeenCalledWith("start");
      expect(startSpy).toHaveBeenCalledWith("complete");
      expect(result).toEqual({ output: "processed-test" });
    });

    it("should run the task graph with provided input parameters", async () => {
      workflow = workflow.TestSimpleTask();

      const startSpy = spyOn(workflow.events, "emit");
      const result = await workflow.run({ input: "custom-input" });

      expect(startSpy).toHaveBeenCalledWith("start");
      expect(startSpy).toHaveBeenCalledWith("complete");
      expect(result).toEqual({ output: "processed-custom-input" });
    });

    it("should emit error event when task execution fails", async () => {
      workflow = workflow.FailingTask();

      const errorSpy = spyOn(workflow.events, "emit");

      try {
        await workflow.run();
        expect(false).toBe(true); // should not get here
      } catch (error) {
        expect(error).toBeInstanceOf(TaskError);
        expect(errorSpy).toHaveBeenCalledWith("error", expect.any(String));
      }
    });
  });

  describe("abort", () => {
    it("should abort a running task graph", async () => {
      workflow = workflow.LongRunningTask();

      const runPromise = workflow.run();
      await sleep(1);
      workflow.abort();

      expect(runPromise).rejects.toThrow();
    });
  });

  describe("pop", () => {
    it("should remove the last task from the graph", () => {
      workflow = workflow.TestSimpleTask({ input: "test1" }).TestSimpleTask({ input: "test2" });

      expect(workflow.graph.getTasks()).toHaveLength(2);

      workflow.pop();

      expect(workflow.graph.getTasks()).toHaveLength(1);
      expect(workflow.graph.getTasks()[0].runInputData).toEqual({ input: "test1" });
    });

    it("should set error when trying to pop from empty graph", () => {
      workflow.pop();

      expect(workflow.error).toBe("No tasks to remove");
    });
  });

  describe("toJSON and toDependencyJSON", () => {
    it("should convert the task graph to JSON", () => {
      const addTestTask = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(TestSimpleTask);

      workflow = addTestTask.call(workflow, { input: "test" });

      const json = workflow.toJSON();

      expect(json).toHaveProperty("tasks");
      expect(json).toHaveProperty("dataflows");
      expect(json.tasks).toHaveLength(1);
    });

    it("should convert the task graph to dependency JSON", () => {
      const addTestTask = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(TestSimpleTask);

      workflow = addTestTask.call(workflow, { input: "test" });

      const json = workflow.toDependencyJSON();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(1);
    });
  });

  describe("parallel", () => {
    it("should create a compound task with parallel workflows", async () => {
      workflow.parallel(
        [new TestSimpleTask({ input: "test1" }), new TestSimpleTask({ input: "test2" })],
        "unordered-array"
      );

      expect(workflow.graph.getTasks()).toHaveLength(1);
      expect(workflow.graph.getTasks()[0]).toBeInstanceOf(Task);

      const compoundTask = workflow.graph.getTasks()[0];
      expect(compoundTask.subGraph?.getTasks()).toHaveLength(2);
      const result = await compoundTask.run();
      expect(result.data).toEqual([{ output: "processed-test1" }, { output: "processed-test2" }]);
    });
  });

  describe("rename", () => {
    it("should rename an output to a new target input", () => {
      const addOutputTask = Workflow.createWorkflow<
        { input: string },
        { customOutput: string },
        TaskConfig
      >(TestOutputTask);
      const addInputTask = Workflow.createWorkflow<
        { customInput: string },
        { output: string },
        TaskConfig
      >(TestInputTask);
      workflow = addOutputTask.call(workflow, { input: "test" });
      workflow.rename("customOutput", "customInput");
      workflow = addInputTask.call(workflow);

      const nodes = workflow.graph.getTasks();
      expect(nodes).toHaveLength(2);

      // Check that the dataflow was created correctly
      const dataflows = workflow.graph.getDataflows();
      expect(dataflows).toHaveLength(1);
      const dataflow = dataflows[0];
      expect(dataflow.sourceTaskId).toBe(nodes[0].config.id);
      expect(dataflow.sourceTaskPortId).toBe("customOutput");
      expect(dataflow.targetTaskId).toBe(nodes[1].config.id);
      expect(dataflow.targetTaskPortId).toBe("customInput");
    });

    it("should throw error when source output doesn't exist", () => {
      const addTestTask = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(TestSimpleTask);

      workflow = addTestTask.call(workflow, { input: "test" });

      expect(() => workflow.rename("nonExistentOutput", "customInput")).toThrow(WorkflowError);
      expect(workflow.error).toContain("Output nonExistentOutput not found");
    });
  });

  describe("reset", () => {
    it("should reset the workflow to its initial state", () => {
      const addTestTask = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(TestSimpleTask);

      workflow = addTestTask.call(workflow, { input: "test" });
      expect(workflow.graph.getTasks()).toHaveLength(1);

      const changedSpy = spyOn(workflow.events, "emit");
      workflow.reset();

      expect(workflow.graph.getTasks()).toHaveLength(0);
      expect(workflow.error).toBe("");
      expect(changedSpy).toHaveBeenCalledWith("changed", undefined);
      expect(changedSpy).toHaveBeenCalledWith("reset");
    });
  });

  describe("event handling", () => {
    it("should emit changed event when graph changes", () => {
      const changedHandler = spyOn(
        {
          handleEvent: () => {},
        },
        "handleEvent"
      );
      workflow.on("changed", changedHandler);

      const addTestTask = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(TestSimpleTask);
      workflow = addTestTask.call(workflow, { input: "test" });

      expect(changedHandler).toHaveBeenCalled();
    });

    it("should allow subscribing to events with on/off/once", () => {
      const handler = spyOn(
        {
          handleEvent: () => {},
        },
        "handleEvent"
      );

      workflow.on("reset", handler);
      workflow.reset();
      expect(handler).toHaveBeenCalledTimes(1);

      workflow.off("reset", handler);
      workflow.reset();
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again

      const onceHandler = spyOn(
        {
          handleEvent: () => {},
        },
        "handleEvent"
      );
      workflow.once("reset", onceHandler);
      workflow.reset();
      workflow.reset();
      expect(onceHandler).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should allow waiting for events with emitted", async () => {
      const resetPromise = workflow.waitOn("reset");

      setTimeout(() => workflow.reset(), 10);

      expect(resetPromise).resolves.toEqual([]);
    });
  });

  describe("auto-connection behavior", () => {
    it("should auto-connect tasks with matching input/output types and ids", () => {
      const addTestTask1 = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(TestSimpleTask);
      const addTestTask2 = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(TestSimpleTask);
      workflow = addTestTask1.call(workflow, { input: "test" });
      workflow = addTestTask2.call(workflow);

      const edges = workflow.graph.getDataflows();
      expect(edges).toHaveLength(1);
      expect(edges[0].sourceTaskPortId).toBe("output");
      expect(edges[0].targetTaskPortId).toBe("input");
    });

    it("should not auto-connect when types don't match", () => {
      const addStringTask = Workflow.createWorkflow<
        { input: string },
        { output: string },
        TaskConfig
      >(StringTask);
      const addNumberTask = Workflow.createWorkflow<
        { input: number },
        { output: number },
        TaskConfig
      >(NumberTask);
      workflow = addStringTask.call(workflow, { input: "test" });

      // This should set an error because types don't match
      workflow = addNumberTask.call(workflow);

      expect(workflow.error).toContain("Could not find a match");
      expect(workflow.graph.getTasks()).toHaveLength(1); // Second task not added
    });
  });

  describe("static methods", () => {
    it("should create a workflow using static methods", () => {
      const workflow = Workflow.pipe(new TestSimpleTask(), new TestSimpleTask());
      expect(workflow).toBeInstanceOf(Workflow);
    });

    it("should create a workflow using static methods", () => {
      const workflow = Workflow.parallel([new TestSimpleTask(), new TestSimpleTask()]);
      expect(workflow).toBeInstanceOf(Workflow);
    });
  });
});
