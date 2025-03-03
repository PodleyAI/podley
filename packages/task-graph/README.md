# @ellmers/task-graph

A lightweight library for building and executing DAG (Directed Acyclic Graph) pipelines of AI tasks. Provides persistent storage solutions and workflow management for complex task orchestration.

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Core Concepts](#core-concepts)
  - [Task Types](#task-types)
  - [Task Graph and Workflow](#task-graph-and-workflow)
  - [Storage](#storage)
- [Testing](#testing)
- [License](#license)

## Installation

```bash
bun add @ellmers/task-graph
```

## Basic Usage

```typescript
import { TaskGraph, Dataflow, TaskGraphRunner } from "@ellmers/task-graph";

// Define tasks
class DataLoader extends Task {
  /* ... */
}
class ModelRunner extends Task {
  /* ... */
}

// Build graph
const graph = new TaskGraph()
  .addTask(new DataLoader({ id: "loader" }))
  .addTask(new ModelRunner({ id: "model" }))
  .addDataflow(new Dataflow("loader", "data", "model", "input"));

// Execute graph
const runner = new TaskGraphRunner(graph);
await runner.run(graph);
```

## Core Concepts

### Task Types

- **Task**: Atomic unit of work
- **Task (isCompound=true)**: Group of tasks forming a subgraph
- **ArrayTask**: Parallel task execution
- **JobQueueTask**: Integration with job queues

[See Task Types Documentation](./src/task/README.md) for more details

### Task Graph and Workflow

- **TaskGraph**: Manage tasks and dependencies
- **Workflow**: Quick way to build complex workflows

[See Task Graph and Workflow Documentation](./src/task-graph/README.md) for more details

### Storage

- **Task Output Repositories**: Cache task outputs for faster re-runs
- **Task Graph Repositories**: Persist workflow state

[See Storage Module Documentation](./src/storage/README.md) for more details

## Testing

Run the full test suite:

```bash
bun test
```

## License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.
