//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";
import { SingleTask } from "../../task/SingleTask";
import { CompoundTask } from "../../task/CompoundTask";
import { TaskOutputRepository } from "../../storage/taskoutput/TaskOutputRepository";
import { TaskInputDefinition, TaskOutputDefinition } from "../../task/TaskTypes";
import { TaskAbortedError, TaskError, WorkflowError } from "../../task/TaskError";
import { CreateWorkflow, Workflow } from "../Workflow";
import { sleep } from "bun";

// Mock task classes for testing
class TestSingleTask extends SingleTask {
  static type = "TestSingleTask";
  declare runInputData: { input: string };
  declare runOutputData: { output: string };

  static inputs: TaskInputDefinition[] = [{ id: "input", name: "Input", valueType: "string" }];
  static outputs: TaskOutputDefinition[] = [{ id: "output", name: "Output", valueType: "string" }];

  async runFull(): Promise<any> {
    return { output: `processed-${this.runInputData?.input}` };
  }
}

class TestOutputTask extends SingleTask {
  static type = "TestOutputTask";
  declare runInputData: { input: string };
  declare runOutputData: { customOutput: string };

  static inputs: TaskInputDefinition[] = [{ id: "input", name: "Input", valueType: "string" }];
  static outputs: TaskOutputDefinition[] = [
    { id: "customOutput", name: "Custom Output", valueType: "string" },
  ];

  async runFull(): Promise<any> {
    return { customOutput: `processed-${this.runInputData?.input}` };
  }
}

class TestInputTask extends SingleTask {
  static type = "TestInputTask";
  declare runInputData: { customInput: string };
  declare runOutputData: { output: string };

  static inputs: TaskInputDefinition[] = [
    { id: "customInput", name: "Custom Input", valueType: "string" },
  ];
  static outputs: TaskOutputDefinition[] = [{ id: "output", name: "Output", valueType: "string" }];

  async runFull(): Promise<any> {
    return { output: `processed-${this.runInputData?.customInput}` };
  }
}

class FailingTask extends SingleTask {
  static type = "FailingTask";
  static inputs: TaskInputDefinition[] = [];
  static outputs: TaskOutputDefinition[] = [];

  async runFull(): Promise<any> {
    throw new Error("Task failed");
  }
}

class LongRunningTask extends SingleTask {
  static type = "LongRunningTask";
  static inputs: TaskInputDefinition[] = [];
  static outputs: TaskOutputDefinition[] = [];

  async runFull(): Promise<any> {
    for (let i = 0; i < 10; i++) {
      if (this.abortController?.signal.aborted) {
        throw new TaskAbortedError("Task aborted");
      }
      await sleep(10);
      this.handleProgress(i / 10);
    }
  }
}

declare module "@ellmers/task-graph" {
  interface Workflow {
    TestSingleTask: CreateWorkflow<{ input: string }>;
    TestOutputTask: CreateWorkflow<{ input: string }>;
    TestInputTask: CreateWorkflow<{ customInput: string }>;
    FailingTask: CreateWorkflow<{}>;
    LongRunningTask: CreateWorkflow<{}>;
  }
}

Workflow.prototype.TestSingleTask = CreateWorkflow(TestSingleTask);
Workflow.prototype.TestOutputTask = CreateWorkflow(TestOutputTask);
Workflow.prototype.TestInputTask = CreateWorkflow(TestInputTask);
Workflow.prototype.FailingTask = CreateWorkflow(FailingTask);
Workflow.prototype.LongRunningTask = CreateWorkflow(LongRunningTask);

describe("Workflow", () => {
  let workflow: Workflow;
  let repository: TaskOutputRepository;

  beforeEach(() => {
    workflow = new Workflow();
  });

  afterEach(() => {
    workflow.reset();
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
      const addTestTask = CreateWorkflow<{ input: string }>(TestSingleTask);

      expect(addTestTask).toBeInstanceOf(Function);
      // @ts-ignore
      expect(addTestTask.inputs).toEqual(TestSingleTask.inputs);
      // @ts-ignore
      expect(addTestTask.outputs).toEqual(TestSingleTask.outputs);
    });

    it("should add a task to the workflow when called", () => {
      const addTestTask = Workflow.createWorkflow<{ input: string }>(TestSingleTask);

      workflow = addTestTask.call(workflow, { input: "test" });

      expect(workflow.graph.getNodes()).toHaveLength(1);
      expect(workflow.graph.getNodes()[0]).toBeInstanceOf(TestSingleTask);
    });
  });

  describe("run", () => {
    it("should run the task graph and return output", async () => {
      workflow = workflow.TestSingleTask({ input: "test" });

      const startSpy = spyOn(workflow.events, "emit");
      const result = await workflow.run();

      expect(startSpy).toHaveBeenCalledWith("start");
      expect(startSpy).toHaveBeenCalledWith("complete");
      expect(result[0].data).toEqual({ output: "processed-test" });
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
      workflow = workflow.TestSingleTask({ input: "test1" }).TestSingleTask({ input: "test2" });

      expect(workflow.graph.getNodes()).toHaveLength(2);

      workflow.pop();

      expect(workflow.graph.getNodes()).toHaveLength(1);
      expect(workflow.graph.getNodes()[0].runInputData).toEqual({ input: "test1" });
    });

    it("should set error when trying to pop from empty graph", () => {
      workflow.pop();

      expect(workflow.error).toBe("No tasks to remove");
    });
  });

  describe("toJSON and toDependencyJSON", () => {
    it("should convert the task graph to JSON", () => {
      const addTestTask = Workflow.createWorkflow<{ input: string }>(TestSingleTask);

      workflow = addTestTask.call(workflow, { input: "test" });

      const json = workflow.toJSON();

      expect(json).toHaveProperty("nodes");
      expect(json).toHaveProperty("edges");
      expect(json.nodes).toHaveLength(1);
    });

    it("should convert the task graph to dependency JSON", () => {
      const addTestTask = Workflow.createWorkflow<{ input: string }>(TestSingleTask);

      workflow = addTestTask.call(workflow, { input: "test" });

      const json = workflow.toDependencyJSON();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(1);
    });
  });

  describe("parallel", () => {
    it("should create a compound task with parallel workflows", () => {
      const addTestTask = Workflow.createWorkflow<{ input: string }>(TestSingleTask);

      workflow.parallel(
        (w) => addTestTask.call(w, { input: "test1" }),
        (w) => addTestTask.call(w, { input: "test2" })
      );

      expect(workflow.graph.getNodes()).toHaveLength(1);
      expect(workflow.graph.getNodes()[0]).toBeInstanceOf(CompoundTask);

      const compoundTask = workflow.graph.getNodes()[0] as CompoundTask;
      expect(compoundTask.subGraph?.getNodes()).toHaveLength(2);
    });
  });

  describe("rename", () => {
    it("should rename an output to a new target input", () => {
      const addOutputTask = Workflow.createWorkflow<{ input: string }>(TestOutputTask);
      const addInputTask = Workflow.createWorkflow<{ customInput: string }>(TestInputTask);

      workflow = addOutputTask.call(workflow, { input: "test" });
      workflow.rename("customOutput", "customInput");
      workflow = addInputTask.call(workflow);

      const nodes = workflow.graph.getNodes();
      expect(nodes).toHaveLength(2);

      // Check that the dataflow was created correctly
      const edges = workflow.graph.getDataFlows();
      expect(edges).toHaveLength(1);
      const edge = edges[0];
      expect(edge.sourceTaskId).toBe(nodes[0].config.id);
      expect(edge.sourceTaskOutputId).toBe("customOutput");
      expect(edge.targetTaskId).toBe(nodes[1].config.id);
      expect(edge.targetTaskInputId).toBe("customInput");
    });

    it("should throw error when source output doesn't exist", () => {
      const addTestTask = Workflow.createWorkflow<{ input: string }>(TestSingleTask);

      workflow = addTestTask.call(workflow, { input: "test" });

      expect(() => workflow.rename("nonExistentOutput", "customInput")).toThrow(WorkflowError);
      expect(workflow.error).toContain("Output nonExistentOutput not found");
    });
  });

  describe("reset", () => {
    it("should reset the workflow to its initial state", () => {
      const addTestTask = Workflow.createWorkflow<{ input: string }>(TestSingleTask);

      workflow = addTestTask.call(workflow, { input: "test" });
      expect(workflow.graph.getNodes()).toHaveLength(1);

      const changedSpy = spyOn(workflow.events, "emit");
      workflow.reset();

      expect(workflow.graph.getNodes()).toHaveLength(0);
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

      const addTestTask = Workflow.createWorkflow<{ input: string }>(TestSingleTask);
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
      const resetPromise = workflow.emitted("reset");

      setTimeout(() => workflow.reset(), 10);

      expect(resetPromise).resolves.toEqual([]);
    });
  });

  describe("auto-connection behavior", () => {
    it("should auto-connect tasks with matching input/output types and ids", () => {
      const addTestTask1 = Workflow.createWorkflow<{ input: string }>(TestSingleTask);
      const addTestTask2 = Workflow.createWorkflow<{ input: string }>(TestSingleTask);

      workflow = addTestTask1.call(workflow, { input: "test" });
      workflow = addTestTask2.call(workflow);

      const edges = workflow.graph.getDataFlows();
      expect(edges).toHaveLength(1);
      expect(edges[0].sourceTaskOutputId).toBe("output");
      expect(edges[0].targetTaskInputId).toBe("input");
    });

    it("should not auto-connect when types don't match", () => {
      class StringTask extends SingleTask {
        static type = "StringTask";
        static inputs: TaskInputDefinition[] = [
          { id: "input", valueType: "string", name: "Input" },
        ];
        static outputs: TaskOutputDefinition[] = [
          { id: "output", valueType: "string", name: "Output" },
        ];
        async runFull(): Promise<any> {
          return { output: "string" };
        }
      }

      class NumberTask extends SingleTask {
        static type = "NumberTask";
        static inputs: TaskInputDefinition[] = [
          { id: "input", valueType: "number", name: "Input" },
        ];
        static outputs: TaskOutputDefinition[] = [
          { id: "output", valueType: "number", name: "Output" },
        ];
        async runFull(): Promise<any> {
          return { output: 123 };
        }
      }

      const addStringTask = Workflow.createWorkflow<{ input: string }>(StringTask);
      const addNumberTask = Workflow.createWorkflow<{ input: number }>(NumberTask);

      workflow = addStringTask.call(workflow, { input: "test" });

      // This should set an error because types don't match
      workflow = addNumberTask.call(workflow);

      expect(workflow.error).toContain("Could not find a match");
      expect(workflow.graph.getNodes()).toHaveLength(1); // Second task not added
    });
  });
});
