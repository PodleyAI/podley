import { describe, expect, it } from "bun:test";
import { GraphAsTask, Task, TaskGraph, Dataflow } from "@podley/task-graph";
import { Type } from "@sinclair/typebox";

// Test tasks with specific input/output schemas
class TaskA extends Task {
  static type = "TaskA";
  static category = "Test";

  static inputSchema() {
    return Type.Object({
      inputA1: Type.String({ description: "First input to A" }),
      inputA2: Type.Number({ description: "Second input to A", default: 42 }),
    });
  }

  static outputSchema() {
    return Type.Object({
      outputA: Type.String({ description: "Output from A" }),
    });
  }

  async execute(input: any): Promise<any> {
    return {
      outputA: `${input.inputA1}-${input.inputA2}`,
    };
  }
}

class TaskB extends Task {
  static type = "TaskB";
  static category = "Test";

  static inputSchema() {
    return Type.Object({
      inputB: Type.String({ description: "Input to B" }),
    });
  }

  static outputSchema() {
    return Type.Object({
      outputB: Type.String({ description: "Output from B" }),
    });
  }

  async execute(input: any): Promise<any> {
    return {
      outputB: `processed-${input.inputB}`,
    };
  }
}

class TaskC extends Task {
  static type = "TaskC";
  static category = "Test";

  static inputSchema() {
    return Type.Object({
      inputC1: Type.String({ description: "First input to C" }),
      inputC2: Type.String({ description: "Second input to C" }),
    });
  }

  static outputSchema() {
    return Type.Object({
      outputC1: Type.String({ description: "First output from C" }),
      outputC2: Type.Number({ description: "Second output from C" }),
    });
  }

  async execute(input: any): Promise<any> {
    return {
      outputC1: `${input.inputC1}+${input.inputC2}`,
      outputC2: input.inputC1.length + input.inputC2.length,
    };
  }
}

describe("GraphAsTask Dynamic Schema", () => {
  describe("Input Schema Calculation", () => {
    it("should calculate input schema from unconnected inputs of starting nodes", () => {
      // Create a graph with TaskA -> TaskB
      // TaskA is the starting node, TaskB is connected
      const taskA = new TaskA();
      const taskB = new TaskB();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);

      // Connect TaskA's output to TaskB's input
      const dataflow = new Dataflow(taskA.config.id, "outputA", taskB.config.id, "inputB");
      graph.addDataflow(dataflow);

      // Create GraphAsTask with this subgraph
      const graphAsTask = new GraphAsTask();
      graphAsTask.subGraph = graph;

      // The input schema should be the inputs of TaskA (the starting node)
      const inputSchema = graphAsTask.inputSchema;
      expect(inputSchema.properties).toBeDefined();
      expect(inputSchema.properties!["inputA1"]).toBeDefined();
      expect(inputSchema.properties!["inputA2"]).toBeDefined();
      expect(inputSchema.properties!["inputB"]).toBeUndefined(); // TaskB's input is connected
    });

    it("should combine inputs from multiple starting nodes", () => {
      // Create a graph with TaskA and TaskB both starting, connecting to TaskC
      const taskA = new TaskA();
      const taskB = new TaskB();
      const taskC = new TaskC();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);
      graph.addTask(taskC);

      // Connect TaskA -> TaskC and TaskB -> TaskC
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskC.config.id, "inputC1"));
      graph.addDataflow(new Dataflow(taskB.config.id, "outputB", taskC.config.id, "inputC2"));

      const graphAsTask = new GraphAsTask();
      graphAsTask.subGraph = graph;

      // The input schema should combine inputs from both TaskA and TaskB
      const inputSchema = graphAsTask.inputSchema;
      expect(inputSchema.properties).toBeDefined();
      expect(inputSchema.properties!["inputA1"]).toBeDefined();
      expect(inputSchema.properties!["inputA2"]).toBeDefined();
      expect(inputSchema.properties!["inputB"]).toBeDefined();
      expect(inputSchema.properties!["inputC1"]).toBeUndefined(); // Connected
      expect(inputSchema.properties!["inputC2"]).toBeUndefined(); // Connected
    });

    it("should exclude connected inputs from schema", () => {
      // Create a graph where a starting node has some inputs connected
      const taskA = new TaskA();
      const taskB = new TaskB();
      const taskC = new TaskC();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);
      graph.addTask(taskC);

      // TaskC is a starting node, but one of its inputs is connected from TaskA
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskC.config.id, "inputC1"));

      const graphAsTask = new GraphAsTask();
      graphAsTask.subGraph = graph;

      // TaskA and TaskC are starting nodes (no incoming edges)
      // But TaskC's inputC1 is connected
      const inputSchema = graphAsTask.inputSchema;
      expect(inputSchema.properties).toBeDefined();
      expect(inputSchema.properties!["inputA1"]).toBeDefined(); // TaskA input
      expect(inputSchema.properties!["inputA2"]).toBeDefined(); // TaskA input
      expect(inputSchema.properties!["inputC1"]).toBeUndefined(); // Connected
      expect(inputSchema.properties!["inputC2"]).toBeDefined(); // Not connected
    });

    it("should return static schema when no children", () => {
      const graphAsTask = new GraphAsTask();

      // Should return the static empty schema
      const inputSchema = graphAsTask.inputSchema;
      expect(inputSchema).toBeDefined();
      expect(Object.keys(inputSchema.properties || {}).length).toBe(0);
    });
  });

  describe("Output Schema Calculation", () => {
    it("should calculate output schema from ending nodes", () => {
      // Create a graph with TaskA -> TaskB
      // TaskB is the ending node
      const taskA = new TaskA();
      const taskB = new TaskB();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);

      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskB.config.id, "inputB"));

      const graphAsTask = new GraphAsTask();
      graphAsTask.subGraph = graph;

      // The output schema should be TaskB's outputs (the ending node)
      const outputSchema = graphAsTask.outputSchema;
      expect(outputSchema.properties).toBeDefined();
      expect(outputSchema.properties!["outputB"]).toBeDefined();
      expect(outputSchema.properties!["outputA"]).toBeUndefined(); // TaskA is not an ending node
    });

    it("should combine outputs from multiple ending nodes", () => {
      // Create a graph with TaskA splitting to TaskB and TaskC (both ending)
      const taskA = new TaskA();
      const taskB = new TaskB();
      const taskC = new TaskC();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);
      graph.addTask(taskC);

      // TaskA connects to both TaskB and TaskC
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskB.config.id, "inputB"));
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskC.config.id, "inputC1"));

      const graphAsTask = new GraphAsTask();
      graphAsTask.subGraph = graph;

      // The output schema should combine outputs from both TaskB and TaskC
      const outputSchema = graphAsTask.outputSchema;
      expect(outputSchema.properties).toBeDefined();
      expect(outputSchema.properties!["outputB"]).toBeDefined();
      expect(outputSchema.properties!["outputC1"]).toBeDefined();
      expect(outputSchema.properties!["outputC2"]).toBeDefined();
      expect(outputSchema.properties!["outputA"]).toBeUndefined(); // TaskA is not ending
    });

    it("should return static schema when no children", () => {
      const graphAsTask = new GraphAsTask();

      // Should return the static empty schema
      const outputSchema = graphAsTask.outputSchema;
      expect(outputSchema).toBeDefined();
      expect(Object.keys(outputSchema.properties || {}).length).toBe(0);
    });
  });

  describe("Full Graph Integration", () => {
    it("should work with a complete graph execution", async () => {
      // Create a simple pipeline: TaskA -> TaskB
      const taskA = new TaskA({ inputA1: "test", inputA2: 10 });
      const taskB = new TaskB();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskB.config.id, "inputB"));

      const graphAsTask = new GraphAsTask();
      graphAsTask.subGraph = graph;

      // Verify schemas are calculated correctly
      const inputSchema = graphAsTask.inputSchema;
      const outputSchema = graphAsTask.outputSchema;

      expect(inputSchema.properties!["inputA1"]).toBeDefined();
      expect(inputSchema.properties!["inputA2"]).toBeDefined();
      expect(outputSchema.properties!["outputB"]).toBeDefined();

      // Execute the graph
      const result = await graphAsTask.run({ inputA1: "hello", inputA2: 99 });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.outputB).toBe("processed-hello-99");
    });

    it("should handle complex multi-path graphs", async () => {
      // Create a diamond graph:
      //      TaskA
      //     /    \
      //  TaskB  TaskC (inputC2 unconnected)
      //     \    /
      //      (outputs from both)

      const taskA = new TaskA({ inputA1: "start", inputA2: 1 });
      const taskB = new TaskB();
      const taskC = new TaskC();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);
      graph.addTask(taskC);

      // Fork from TaskA
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskB.config.id, "inputB"));
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskC.config.id, "inputC1"));

      const graphAsTask = new GraphAsTask();
      graphAsTask.subGraph = graph;

      // Check schemas
      const inputSchema = graphAsTask.inputSchema;
      const outputSchema = graphAsTask.outputSchema;

      // TaskA's inputs + TaskC's unconnected inputC2
      expect(inputSchema.properties!["inputA1"]).toBeDefined();
      expect(inputSchema.properties!["inputA2"]).toBeDefined();
      expect(inputSchema.properties!["inputC2"]).toBeDefined();

      // Both TaskB and TaskC outputs
      expect(outputSchema.properties!["outputB"]).toBeDefined();
      expect(outputSchema.properties!["outputC1"]).toBeDefined();
      expect(outputSchema.properties!["outputC2"]).toBeDefined();

      // Execute
      const result = await graphAsTask.run({
        inputA1: "begin",
        inputA2: 5,
        inputC2: "extra",
      });

      // When there are multiple ending nodes, the compoundMerge strategy
      // collects outputs into arrays for each property
      expect(result.outputB).toEqual(["processed-begin-5"]);
      expect(result.outputC1).toEqual(["begin-5+extra"]);
      expect(result.outputC2).toEqual([12]); // "begin-5" (7) + "extra" (5)
    });
  });

  describe("Merge Strategy", () => {
    it("should generate correct schema for PROPERTY_ARRAY strategy with single ending node", () => {
      // Create a graph with single ending node
      const taskA = new TaskA();
      const taskB = new TaskB();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskB.config.id, "inputB"));

      const graphAsTask = new GraphAsTask({}, { compoundMerge: "PROPERTY_ARRAY" });
      graphAsTask.subGraph = graph;

      const outputSchema = graphAsTask.outputSchema;

      // Single ending node: properties should NOT be arrays
      expect(outputSchema.properties!["outputB"]).toBeDefined();
      expect((outputSchema.properties!["outputB"] as any).type).not.toBe("array");
    });

    it("should generate correct schema for PROPERTY_ARRAY strategy with multiple ending nodes", () => {
      // Create a graph with multiple ending nodes
      const taskA = new TaskA();
      const taskB = new TaskB();
      const taskC = new TaskC();

      const graph = new TaskGraph();
      graph.addTask(taskA);
      graph.addTask(taskB);
      graph.addTask(taskC);

      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskB.config.id, "inputB"));
      graph.addDataflow(new Dataflow(taskA.config.id, "outputA", taskC.config.id, "inputC1"));

      const graphAsTask = new GraphAsTask({}, { compoundMerge: "PROPERTY_ARRAY" });
      graphAsTask.subGraph = graph;

      const outputSchema = graphAsTask.outputSchema;

      // Multiple ending nodes: all properties should be arrays (due to collectPropertyValues behavior)
      expect((outputSchema.properties!["outputB"] as any).type).toBe("array");
      expect((outputSchema.properties!["outputC1"] as any).type).toBe("array");
      expect((outputSchema.properties!["outputC2"] as any).type).toBe("array");
    });
  });
});
