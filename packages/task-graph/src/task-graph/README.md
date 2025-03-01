# Task Graph Package

A robust TypeScript library for creating and managing task graphs with dependencies, enabling complex workflow orchestration and execution.

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
  - [Creating a Task Graph](#creating-a-task-graph)
  - [Executing Tasks](#executing-tasks)
  - [Workflow API](#workflow-api)
- [Key Components](#key-components)
  - [TaskGraph](#taskgraph)
  - [DataFlow](#dataflow)
  - [TaskGraphRunner](#taskgraphrunner)
  - [Workflow](#workflow)
- [Testing](#testing)
- [API Reference](#api-reference)
  - [`TaskGraph` Class](#taskgraph-class)
  - [`Workflow` Class](#workflow-class)
  - [Testing](#testing-1)
- [License](#license)

## Features

- Directed Acyclic Graph (DAG) structure for task dependencies
- Data flow management between task inputs/outputs
- Workflow builder API with fluent interface
- Provenance tracking
- Caching of task results (same run on same input returns cached result)
- Error handling and abortion support
- Serial and parallel execution patterns
- Reactive execution capabilities to drive UI updates

## Installation

```bash
# Within the monorepo
npm install @ellmers/task-graph
```

## Basic Usage

### Creating a Task Graph

```typescript
import { TaskGraph, DataFlow } from "@ellmers/task-graph";

const graph = new TaskGraph();
const task1 = new TestTask({ id: "task1" });
const task2 = new TestTask({ id: "task2" });

graph.addTasks([task1, task2]);
graph.addDataFlow(new DataFlow("task1", "output", "task2", "input"));
```

### Executing Tasks

```typescript
import { TaskGraphRunner } from "@ellmers/task-graph";

const runner = new TaskGraphRunner(graph);
const results = await runner.runGraph();
```

### Workflow API

```typescript
const workflow = new Workflow()
  .TestSingleTask({ input: "start" })
  .rename("output", "input")
  .TestProcessingTask()
  .parallel(
    (w) => w.TestParallelTask1(),
    (w) => w.TestParallelTask2()
  );

const output = await workflow.run();
```

## Key Components

### TaskGraph

- Manages nodes (tasks) and edges (data flows)
- Topological sorting
- Serialization/deserialization
- Dependency tracking

### DataFlow

- Connects task outputs to inputs
- Value propagation
- Provenance tracking

### TaskGraphRunner

- Executes tasks with dependency resolution
- Multiple scheduler implementations
- Error handling and recovery
- Abortion support

### Workflow

- Fluent API for graph construction
- Automatic input/output matching
- Parallel task groups
- Error reporting

## Testing

Tests use Bun test runner. To run tests:

```bash
bun test
bun test:watch  # For development
```

## API Reference

### `TaskGraph` Class

- `addTask(task: Task)`: Add a single task
- `addDataFlow(dataflow: DataFlow)`: Connect tasks
- `getSourceTasks()`/`getTargetTasks()`: Navigate dependencies
- `toJSON()`: Serialize graph structure

### `Workflow` Class

- `createWorkflow()`: Task-specific builder methods
- `parallel()`: Create parallel execution branches
- `rename()`: Customize input/output mappings
- `pop()`: Pop a task from the workflow (only use in a repl!)
- `run()`: Execute workflow

### Testing

Tests use Bun test runner. To run tests:

```bash
bun test
```

## License

Apache 2.0 - See [LICENSE](../../../LICENSE) file for details
