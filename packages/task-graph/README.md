# @podley/task-graph

A lightweight yet powerful TypeScript library for building and executing DAG (Directed Acyclic Graph) pipelines of tasks. Provides flexible task orchestration, persistent storage, workflow management, and error handling for complex task execution scenarios.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Tasks](#tasks)
  - [Task Graphs](#task-graphs)
  - [Workflows](#workflows)
  - [Data Flow](#data-flow)
- [Creating Custom Tasks](#creating-custom-tasks)
- [Building Task Graphs](#building-task-graphs)
- [Using Workflows](#using-workflows)
- [Storage and Caching](#storage-and-caching)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Testing](#testing)
- [License](#license)

## Installation

```bash
npm install @podley/task-graph
# or
bun add @podley/task-graph
# or
yarn add @podley/task-graph
```

## Quick Start

Here's a simple example that demonstrates the core concepts:

```typescript
import { Task, TaskGraph, Dataflow, Workflow } from "@podley/task-graph";
import { Type } from "@sinclair/typebox";

// 1. Define a custom task
class MultiplyBy2Task extends Task<{ value: number }, { result: number }> {
  static readonly type = "MultiplyBy2Task";
  static readonly category = "Math";
  static readonly title = "Multiply by 2";
  static readonly description = "Multiplies a number by 2";

  static inputSchema() {
    return Type.Object({
      value: Type.Number({ description: "Input number" }),
    });
  }

  static outputSchema() {
    return Type.Object({
      result: Type.Number({ description: "Multiplied result" }),
    });
  }

  async execute(input: { value: number }) {
    return { result: input.value * 2 };
  }
}

// 2. Use the Task

// 2.1 Use it directly
const task = new MultiplyBy2Task({ value: 15 });
const result = await task.run();
console.log(result); // { result: 30 }

// 2.2 Use it with TaskGraph
const graph = new TaskGraph();
graph.addTask(new MultiplyBy2Task({ value: 15 }, { id: "multiply1" }));
graph.addTask(new MultiplyBy2Task({}, { id: "multiply2" }));
graph.addDataflow(new Dataflow("multiply1", "result", "multiply2", "value"));

const results = await graph.run();
console.log(results); // [{ id: "multiply1", data: { result: 60 } }]

// 2.3 With Workflow
const wf = new Workflow();
wf.addTask(new MultiplyBy2Task({ value: 15 }));
wf.addTask(new MultiplyBy2Task()); // auto-connects to previous task
const result = await wf.run();
console.log(result); // { result: 60 }

// 2.3.1 Adding to Workflow
import { CreateWorkflow } from "@podley/task-graph";
declare module "@podley/task-graph" {
  interface Workflow {
    MultiplyBy2: CreateWorkflow<{ value: number }>;
  }
}
Workflow.prototype.MultiplyBy2 = CreateWorkflow(MultiplyBy2Task);

const wf = new Workflow();
wf.MultiplyBy2({ value: 15 });
wf.MultiplyBy2(); // input is output from previous task
const result = await wf.run();
console.log(result); // { result: 60 }

// 2.3 Create a helper function
export const MultiplyBy2 = (input: { value: number }) => {
  return new MultiplyBy2Task(input).run();
};
const first = await MultiplyBy2({ value: 15 });
const second = await MultiplyBy2({ value: first.result });
console.log(second); // { result: 60 }
```

## Core Concepts

### Tasks

Tasks are the fundamental units of work. Each task:

- Defines input/output schemas using TypeBox
- Implements `execute()` for main logic or `executeReactive()` for UI updates
- Has a unique type identifier and category
- Can be cached based on inputs
- Emits lifecycle events

### Task Graphs

TaskGraph is the low-level API for building directed acyclic graphs of tasks:

- Manages tasks and their dependencies
- Handles execution order and parallelization
- Provides detailed control over data flow
- Returns results as an array of task outputs

### Data Flow

Data flows between tasks through `Dataflow` objects that specify:

- Source task and output port
- Target task and input port
- Data transformation and validation
- Error propagation
- Edges in the graph

### Workflows

Workflow is the high-level API that provides:

- Builder pattern for easier task composition
- Automatic task connection based on compatible input/output types
- Pipeline operations (`pipe`, `parallel`)
- Simplified result handling
- Event management

## Creating Custom Tasks

### Basic Task Structure

```typescript
import { Task, IExecuteContext } from "@podley/task-graph";
import { Type } from "@sinclair/typebox";

interface MyInput {
  text: string;
  multiplier?: number;
}

interface MyOutput {
  processed: string;
  length: number;
}

class TextProcessorTask extends Task<MyInput, MyOutput> {
  // Required: Unique type identifier
  static readonly type = "TextProcessorTask";

  // Optional: Information for a UI
  static readonly title = "Text Processor";
  static readonly description = "Processes text";
  static readonly category = "Text Processing";

  // Whether outputs can be cached (default: true)
  static readonly cacheable = true;

  // Required: Input schema definition
  static inputSchema() {
    return Type.Object({
      text: Type.String({ description: "Text to process" }),
      multiplier: Type.Optional(
        Type.Number({
          description: "Repeat multiplier",
          default: 1,
        })
      ),
    });
  }

  // Required: Output schema definition
  static outputSchema() {
    return Type.Object({
      processed: Type.String({ description: "Processed text" }),
      length: Type.Number({ description: "Text length" }),
    });
  }

  // Main execution logic
  async execute(input: MyInput, context: IExecuteContext): Promise<MyOutput> {
    const { text, multiplier = 1 } = input;
    const { signal, updateProgress } = context;

    // Check for cancellation
    if (signal?.aborted) {
      throw new TaskAbortedError("Task was cancelled");
    }

    // Report progress
    await updateProgress(0.5, "Processing text...");

    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 100));

    const processed = text.repeat(multiplier);

    return {
      processed,
      length: processed.length,
    };
  }
}
```

### Task with Progress and Error Handling

```typescript
class FileProcessorTask extends Task<{ filePath: string }, { content: string }> {
  static readonly type = "FileProcessorTask";

  static inputSchema() {
    return Type.Object({
      filePath: Type.String({ description: "Path to file" }),
    });
  }

  static outputSchema() {
    return Type.Object({
      content: Type.String({ description: "File content" }),
    });
  }

  async execute(input: { filePath: string }, { signal, updateProgress }: IExecuteContext) {
    try {
      await updateProgress(0.1, "Starting file read...");

      if (signal?.aborted) {
        throw new TaskAbortedError("File read cancelled");
      }

      // Simulate file reading with progress
      await updateProgress(0.5, "Reading file...");
      const content = await this.readFile(input.filePath);

      await updateProgress(1.0, "File read complete");

      return { content };
    } catch (error) {
      if (error instanceof TaskAbortedError) {
        throw error; // Re-throw abort errors
      }
      throw new TaskError(`Failed to read file: ${error.message}`);
    }
  }

  private async readFile(path: string): Promise<string> {
    // Implementation would go here
    return "file content";
  }
}
```

## Building Task Graphs

### Simple Task Graph

```typescript
import { TaskGraph, Dataflow } from "@podley/task-graph";

// Create tasks
const task1 = new TextProcessorTask({ text: "Hello" }, { id: "processor1" });
const task2 = new TextProcessorTask({ text: "World" }, { id: "processor2" });
const task3 = new TextProcessorTask({ text: "" }, { id: "combiner" });

// Build graph
const graph = new TaskGraph();
graph.addTasks([task1, task2, task3]);

// Define data flows
graph.addDataflow(new Dataflow("processor1", "processed", "combiner", "text"));
graph.addDataflow(new Dataflow("processor2", "processed", "combiner", "text"));

// Execute
const results = await graph.run();
```

### Task Graph with Dependencies

```typescript
class AddTask extends Task<{ a: number; b: number }, { sum: number }> {
  static readonly type = "AddTask";

  static inputSchema() {
    return Type.Object({
      a: Type.Number(),
      b: Type.Number(),
    });
  }

  static outputSchema() {
    return Type.Object({
      sum: Type.Number(),
    });
  }

  async execute(input: { a: number; b: number }) {
    return { sum: input.a + input.b };
  }
}

// Create a computational pipeline
const doubleTask = new MultiplyBy2Task({ value: 5 }, { id: "double" });
const doubleTask2 = new MultiplyBy2Task({ value: 5 }, { id: "double2" });
const addTask = new AddTask({}, { id: "add" });

const graph = new TaskGraph();
graph.addTasks([doubleTask, doubleTask2, addTask]);

// Connect outputs to inputs
graph.addDataflow(new Dataflow("double", "result", "add", "a"));
graph.addDataflow(new Dataflow("double2", "result", "add", "b"));

const results = await graph.run();
// Results: double=10, double2=10, add=20
```

### Conditional Execution and Error Handling

```typescript
// Task that might fail
class RiskyTask extends Task<{ shouldFail: boolean }, { success: boolean }> {
  static readonly type = "RiskyTask";

  async execute(input: { shouldFail: boolean }) {
    if (input.shouldFail) {
      throw new TaskError("Task failed as requested");
    }
    return { success: true };
  }
}

// Task that handles errors
class ErrorHandlerTask extends Task<{ fallback: string }, { result: string }> {
  static readonly type = "ErrorHandlerTask";

  async execute(input: { fallback: string }) {
    return { result: input.fallback };
  }
}

const graph = new TaskGraph();
const riskyTask = new RiskyTask({ shouldFail: true }, { id: "risky" });
const handlerTask = new ErrorHandlerTask({ fallback: "default" }, { id: "handler" });

graph.addTasks([riskyTask, handlerTask]);

// Connect error output to handler
graph.addDataflow(new Dataflow("risky", "[error]", "handler", "error"));

try {
  const results = await graph.run();
} catch (error) {
  console.log("Graph execution failed:", error.message);
}
```

## Using Workflows

### Basic Workflow

```typescript
import { Workflow } from "@podley/task-graph";

const workflow = new Workflow();

// Add tasks to workflow
workflow.addTask(new TextProcessorTask({ text: "Hello, World!" }));

// Run workflow
const result = await workflow.run();
console.log(result); // { processed: "Hello, World!", length: 13 }
```

### Pipeline Workflow

```typescript
// Create a processing pipeline
const workflow = new Workflow();

// Method 1: Using workflow.pipe()
workflow.pipe(
  new TextProcessorTask({ text: "Start" }),
  new TextProcessorTask({ multiplier: 2 }),
  new TextProcessorTask({ multiplier: 3 })
);

const result = await workflow.run();

// Method 2: Using the pipe helper
import { pipe } from "@podley/task-graph";

const pipeline = pipe([
  new TextProcessorTask({ text: "Start" }),
  new TextProcessorTask({ multiplier: 2 }),
  new TextProcessorTask({ multiplier: 3 }),
]);

const result2 = await pipeline.run();
```

### Parallel Workflow

```typescript
import { parallel } from "@podley/task-graph";

// Method 1: Using workflow.parallel()
const workflow = new Workflow();
workflow.parallel([
  new TextProcessorTask({ text: "Task 1" }),
  new TextProcessorTask({ text: "Task 2" }),
  new TextProcessorTask({ text: "Task 3" }),
]);

const results = await workflow.run();
// Results will be an array of outputs

// Method 2: Using the parallel helper
const parallelWorkflow = parallel([
  new TextProcessorTask({ text: "Task A" }),
  new TextProcessorTask({ text: "Task B" }),
]);

const results2 = await parallelWorkflow.run();
```

### Complex Workflow with Auto-connections

```typescript
// Workflow automatically connects compatible input/output types
const workflow = new Workflow();

// These will auto-connect because output "result" matches input "value"
workflow.addTask(new MultiplyBy2Task({ value: 5 })); // Outputs: { result: number }
workflow.addTask(new MultiplyBy2Task({})); // Inputs: { value: number }
workflow.addTask(new MultiplyBy2Task({})); // Inputs: { value: number }

const result = await workflow.run();
// Result: 5 * 2 * 2 * 2 = 40
```

### Custom Task Creation for Workflows

```typescript
// Register tasks with the workflow system
declare module "@podley/task-graph" {
  interface Workflow {
    MyTextProcessor: CreateWorkflow<MyInput, MyOutput>;
  }
}

Workflow.prototype.MyTextProcessor = Workflow.createWorkflow(TextProcessorTask);

// Now you can use it fluently
const workflow = new Workflow();
workflow.MyTextProcessor({ text: "Hello" }).MyTextProcessor({ multiplier: 3 });

const result = await workflow.run();
```

## Storage and Caching

### Task Output Caching

Output caching lets repeat executions with identical inputs return instantly without redoing work.

```typescript
import { Task, TaskGraph, Workflow } from "@podley/task-graph";
import { Type } from "@sinclair/typebox";
import { InMemoryTaskOutputRepository } from "@podley/test";

// A cacheable task that simulates expensive work
class ExpensiveTask extends Task<{ n: number }, { result: number }> {
  static readonly type = "ExpensiveTask";
  static readonly cacheable = true;

  static inputSchema() {
    return Type.Object({ n: Type.Number() });
  }

  static outputSchema() {
    return Type.Object({ result: Type.Number() });
  }

  async execute(input: { n: number }) {
    // Simulate 500ms of CPU/IO work
    await new Promise((r) => setTimeout(r, 500));
    return { result: input.n * 2 };
  }
}

// Create an output cache
const outputCache = new InMemoryTaskOutputRepository();

// Example 1: TaskGraph caching (second run is near-instant)
const graph = new TaskGraph({ outputCache });
graph.addTask(new ExpensiveTask({ n: 42 }, { id: "exp" }));

let t = Date.now();
await graph.run();
const firstRunMs = Date.now() - t;

t = Date.now();
await graph.run(); // identical inputs -> served from cache
const secondRunMs = Date.now() - t;

console.log({ firstRunMs, secondRunMs });
// e.g. { firstRunMs: ~500, secondRunMs: ~1-5 }

// Example 2: Direct Task caching across instances
const missTask = new ExpensiveTask({ n: 43 }, { outputCache });
t = Date.now();
await missTask.run(); // cache miss -> compute and store
const missMs = Date.now() - t;

const hitTask = new ExpensiveTask({ n: 43 }, { outputCache });
t = Date.now();
await hitTask.run(); // cache hit -> instant
const hitMs = Date.now() - t;

console.log({ missMs, hitMs });
// e.g. { missMs: ~500, hitMs: ~1-5 }

// Example 3: Workflow with the same cache
const workflow = new Workflow(outputCache);
workflow.addTask(new ExpensiveTask({ n: 10 }));

t = Date.now();
await workflow.run(); // compute
const wfFirstMs = Date.now() - t;

t = Date.now();
await workflow.run(); // cached
const wfSecondMs = Date.now() - t;

console.log({ wfFirstMs, wfSecondMs });
```

### Task Graph Persistence

```typescript
import { FsFolderTaskGraphRepository } from "@podley/test";

// Create repository
const repository = new FsFolderTaskGraphRepository("./task-graphs");

// Save task graph
const graph = new TaskGraph();
graph.addTask(new MultiplyBy2Task({ value: 10 }));
await repository.saveTaskGraph("my-graph", graph);

// Load task graph
const loadedGraph = await repository.getTaskGraph("my-graph");
const results = await loadedGraph.run();
```

### Different Storage Options

```typescript
// In-memory (for testing)
import { InMemoryTaskOutputRepository, InMemoryTaskGraphRepository } from "@podley/test";

// File system
import { FsFolderTaskOutputRepository, FsFolderTaskGraphRepository } from "@podley/test";

// SQLite
import { SqliteTaskOutputRepository, SqliteTaskGraphRepository } from "@podley/test";

// IndexedDB (browser)
import { IndexedDbTaskOutputRepository, IndexedDbTaskGraphRepository } from "@podley/test";
```

## Error Handling

### Task-Level Error Handling

```typescript
class RobustTask extends Task<{ input: string }, { output: string }> {
  async execute(input: { input: string }, { signal }: IExecuteContext) {
    try {
      // Check for cancellation
      if (signal?.aborted) {
        throw new TaskAbortedError("Task cancelled");
      }

      // Your logic here
      const result = await this.processInput(input.input);

      return { output: result };
    } catch (error) {
      if (error instanceof TaskAbortedError) {
        throw error; // Re-throw cancellation
      }

      // Convert to TaskError with context
      throw new TaskError(`Processing failed: ${error.message}`);
    }
  }
}
```

### Graph-Level Error Handling

```typescript
try {
  const results = await graph.run();
} catch (error) {
  if (error instanceof TaskAbortedError) {
    console.log("Execution was cancelled");
  } else if (error instanceof TaskFailedError) {
    console.log("A task failed:", error.message);
    console.log("Failed task:", error.taskId);
  } else if (error instanceof TaskError) {
    console.log("Task error:", error.message);
  }
}
```

### Workflow Error Handling with Events

```typescript
const workflow = new Workflow();

workflow.events.on("error", (error) => {
  console.error("Workflow error:", error);
});

workflow.events.on("start", () => {
  console.log("Workflow started");
});

workflow.events.on("complete", () => {
  console.log("Workflow completed");
});

workflow.addTask(new TextProcessorTask({ text: "Hello" }));
await workflow.run();
```

### Aborting Execution

```typescript
const workflow = new Workflow();
workflow.addTask(new LongRunningTask());

// Start execution
const resultPromise = workflow.run();

// Abort after 1 second
setTimeout(() => {
  workflow.abort();
}, 1000);

try {
  await resultPromise;
} catch (error) {
  if (error instanceof TaskAbortedError) {
    console.log("Execution was aborted");
  }
}
```

## Advanced Patterns

### Array Tasks (Parallel Processing)

```typescript
class ArrayProcessorTask extends ArrayTask<{ items: string[] }, { results: string[] }> {
  static readonly type = "ArrayProcessorTask";

  static inputSchema() {
    return Type.Object({
      items: Type.Array(Type.String(), {
        isArray: "replicate", // Enable array processing
        description: "Items to process",
      }),
    });
  }

  async execute(input: { items: string[] }) {
    // When isArray="replicate", this runs in parallel for each item
    return { results: input.items.map((item) => item.toUpperCase()) };
  }
}

// Process array items in parallel
const task = new ArrayProcessorTask({
  items: ["hello", "world", "foo", "bar"],
});

const result = await task.run();
// { results: ["HELLO", "WORLD", "FOO", "BAR"] }
```

### Job Queue Tasks

```typescript
class RemoteProcessingTask extends JobQueueTask<{ data: string }, { result: string }> {
  static readonly type = "RemoteProcessingTask";

  async createJob() {
    return new Job({
      input: this.runInputData,
      execute: async (input) => {
        // This runs in a job queue (can be distributed)
        const processed = await this.callRemoteAPI(input.data);
        return { result: processed };
      },
    });
  }

  private async callRemoteAPI(data: string): Promise<string> {
    // Simulate API call
    return `Processed: ${data}`;
  }
}
```

### Composite Tasks (Tasks that contain other tasks)

```typescript
class CompositeTask extends GraphAsTask<{ input: string }, { output: string }> {
  static readonly type = "CompositeTask";

  constructor(input: { input: string }, config: any = {}) {
    super(input, config);

    // Build internal graph
    const subTask1 = new TextProcessorTask({ text: input.input });
    const subTask2 = new TextProcessorTask({ multiplier: 2 });

    this.subGraph.addTasks([subTask1, subTask2]);
    this.subGraph.addDataflow(
      new Dataflow(subTask1.config.id, "processed", subTask2.config.id, "text")
    );
  }
}
```

### Dynamic Task Creation

```typescript
class TaskFactory extends Task<{ count: number }, { results: any[] }> {
  async execute(input: { count: number }, context: IExecuteContext) {
    const results = [];

    for (let i = 0; i < input.count; i++) {
      // Create tasks dynamically
      const dynamicTask = new MultiplyBy2Task({ value: i });

      // Register with execution context
      context.own(dynamicTask);

      const result = await dynamicTask.run();
      results.push(result);
    }

    return { results };
  }
}
```

## API Reference

### Core Classes

- **`Task<Input, Output, Config>`**: Base class for all tasks
- **`TaskGraph`**: Low-level graph execution engine
- **`Workflow<Input, Output>`**: High-level workflow builder
- **`Dataflow`**: Represents data flow between tasks
- **`TaskRunner`**: Handles individual task execution

### Key Methods

#### Task

- `run(overrides?)`: Execute the task with optional input overrides
- `runReactive(overrides?)`: Execute in reactive mode
- `abort()`: Cancel execution
- `setInput(input)`: Set input values
- `validateInput(input)`: Validate input against schema

#### TaskGraph

- `addTask(task)` / `addTasks(tasks)`: Add tasks to graph
- `addDataflow(dataflow)` / `addDataflows(dataflows)`: Add data flows
- `run(input?, config?)`: Execute the graph
- `getTask(id)`: Get task by ID
- `getDataflow(id)`: Get dataflow by ID

#### Workflow

- `addTask(task)`: Add task to workflow
- `pipe(...tasks)`: Create pipeline
- `parallel(tasks, strategy?)`: Create parallel execution
- `run(input?)`: Execute workflow
- `abort()`: Cancel execution
- `reset()`: Reset workflow state

### Storage Interfaces

- **`TaskOutputRepository`**: Interface for task output caching
- **`TaskGraphRepository`**: Interface for task graph persistence

### Error Types

- **`TaskError`**: Base error class
- **`TaskAbortedError`**: Task was cancelled
- **`TaskFailedError`**: Task execution failed
- **`TaskInvalidInputError`**: Invalid input provided

## Examples

### Data Processing Pipeline

```typescript
// Define processing tasks
class LoadDataTask extends Task<{ source: string }, { data: any[] }> {
  static readonly type = "LoadDataTask";

  async execute(input: { source: string }) {
    const data = await this.loadFromSource(input.source);
    return { data };
  }

  private async loadFromSource(source: string): Promise<any[]> {
    // Implementation
    return [];
  }
}

class TransformDataTask extends Task<{ data: any[] }, { transformed: any[] }> {
  static readonly type = "TransformDataTask";

  async execute(input: { data: any[] }) {
    const transformed = input.data.map((item) => ({
      ...item,
      processed: true,
      timestamp: new Date(),
    }));
    return { transformed };
  }
}

class SaveDataTask extends Task<{ data: any[] }, { saved: boolean }> {
  static readonly type = "SaveDataTask";

  async execute(input: { data: any[] }) {
    await this.saveToDestination(input.data);
    return { saved: true };
  }

  private async saveToDestination(data: any[]): Promise<void> {
    // Implementation
  }
}

// Build pipeline
const pipeline = pipe([
  new LoadDataTask({ source: "database" }),
  new TransformDataTask(),
  new SaveDataTask(),
]);

const result = await pipeline.run();
```

### Parallel Data Processing

```typescript
// Process multiple data sources in parallel
const workflow = new Workflow();

workflow.parallel([
  new LoadDataTask({ source: "api-1" }),
  new LoadDataTask({ source: "api-2" }),
  new LoadDataTask({ source: "api-3" }),
]);

// Merge results
workflow.addTask(new MergeDataTask());

const result = await workflow.run();
```

### Error Recovery Pipeline

```typescript
class RetryableTask extends Task<{ url: string; retries: number }, { data: any }> {
  async execute(input: { url: string; retries: number }) {
    for (let i = 0; i < input.retries; i++) {
      try {
        const data = await fetch(input.url).then((r) => r.json());
        return { data };
      } catch (error) {
        if (i === input.retries - 1) {
          throw new TaskError(`Failed after ${input.retries} retries: ${error.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    throw new TaskError("Unexpected error");
  }
}

const workflow = new Workflow();
workflow.addTask(new RetryableTask({ url: "https://api.example.com", retries: 3 }));

try {
  const result = await workflow.run();
} catch (error) {
  console.log("All retries failed:", error.message);
}
```

## Testing

The package includes comprehensive test utilities:

```bash
# Run all tests
bun test

# Run specific test file
bun test src/test/task-graph/TaskGraph.test.ts

# Run tests with coverage
bun test --coverage
```

### Testing Your Tasks

```typescript
import { describe, test, expect } from "bun:test";

describe("MyCustomTask", () => {
  test("should process input correctly", async () => {
    const task = new MyCustomTask({ input: "test" });
    const result = await task.run();

    expect(result.output).toBe("expected-result");
  });

  test("should handle errors gracefully", async () => {
    const task = new MyCustomTask({ input: "invalid" });

    await expect(task.run()).rejects.toThrow(TaskError);
  });

  test("should respect cancellation", async () => {
    const task = new LongRunningTask();

    const resultPromise = task.run();
    task.abort();

    await expect(resultPromise).rejects.toThrow(TaskAbortedError);
  });
});
```

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
