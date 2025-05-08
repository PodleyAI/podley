# Task System Documentation

This module provides a flexible task processing system with support for various task types, dependency management, and error handling.

- [Key Components](#key-components)
  - [Core Classes](#core-classes)
- [Task Types](#task-types)
  - [A Simple Task](#a-simple-task)
  - [GraphAsTask](#graphastask)
  - [ArrayTask](#arraytask)
  - [Job Queue Tasks](#job-queue-tasks)
- [Task Lifecycle](#task-lifecycle)
- [Event Handling](#event-handling)
- [Input/Output Schemas](#inputoutput-schemas)
- [Registry \& Queues](#registry--queues)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Installation](#installation)

## Key Components

### Core Classes

- `Task`: Base class implementing core task functionality
- `ArrayTask`: Executes a task or a task with multiple inputs in parallel with a subGraph
- `JobQueueTask`: Integrates with job queue system for distributed processing

## Task Types

### A Simple Task

```typescript
interface MyTaskInput {
  input: number;
}
interface MyTaskOutput {
  result: number;
}
class MyTask extends Task {
  static readonly type = "MyTask"; // Required, unique identifier for the task
  static readonly category = "Utility"; // Optional, used for grouping tasks in UI
  declare runInputData: MyTaskInput;
  declare runOutputData: MyTaskOutput;
  static inputSchema = Type.Object({
    input: Type.Number(),
  });
  static outputSchema = Type.Object({
    result: Type.Number(),
  });

  // typically you either override execute or executeReactive, but not both
  async execute(input: MyTaskInput, config: IExecuteConfig) {
    await sleep(1000);
    if (config.signal?.aborted) {
      throw new TaskAbortedError("Task aborted");
    }
    config.updateProgress(0.5, "Processing...");
    // Do something with the input that takes a long time
    await sleep(1000);
    return { result: input.input * 2 };
  }
  async executeReactive(input: MyTaskInput, output: MyTaskOutput) {
    return { result: input.input * 2 };
  }
}
```

### GraphAsTask

- GraphAsTask tasks are tasks that contain other tasks. They are represented as an internal TaskGraph.
- A ArrayTask is a compound task that can run a task as normal, or if the inputs are an array and the input definition has isArray="replicate" defined for that input, then the task will run parallel copies with a subGraph.

### ArrayTask

- ArrayTask is a task that can run a task as normal, or if the inputs are an arryay and the input definition has isArray="replicate", then the task will run parallel copies with a subGraph.
- The subGraph is a TaskGraph that is created from the inputs of the task.
- The results of the subGraph are combined such that the outputs are turned into arrays.

### Job Queue Tasks

JobQueueTask is a task that can be used to run a task in a job queue. This is useful for when there might be rate limits or other constraints on the task that make it better to run in a job queue than in the main thread.

```typescript
class MyJobTask extends JobQueueTask {
  async createJob() {
    return new Job({
      input: this.runInputData,
      execute: (input) => ({ result: input.value * 3 }),
    });
  }
}
```

## Task Lifecycle

- **Statuses**: `Pending` → `Processing` → (`Completed`|`Failed`|`Aborted`)
- **Methods**:
  - `run()`: Full execution with caching, calls the subclass `execute` method
  - `runReactive()`: Lightweight execution for UI updates, calls the subclass `executeReactive` method
  - `abort()`: Cancel running task

## Event Handling

```typescript
task.on("start", () => console.log("Task started"));
task.on("progress", (p) => console.log(`Progress: ${p}%`));
task.on("complete", () => console.log("Task completed"));
task.on("error", (err) => console.error("Task failed", err));
task.on("abort", () => console.log("Task aborted"));
task.on("regenerate", () => console.log("Task regenerated"));
```

## Input/Output Schemas

The input and output schemas are json schemas that are used to validate the input and output of the task, created via TypeBox.

```typescript
static inputSchema = () => {
  return Type.Object({
    username: Type.Optional(Type.String({
      title: "User Name",
      description: "The name of the user",
      default: "guest",
    }),
  });
};

static outputSchema = () => {
  return Type.Object({
    result: Type.Number({
      title: "Processing Result",
      description: "The result of the processing",
    }),
  });
};
```

## Registry & Queues

The TaskRegistry is used to register tasks to there is a global registry. This is useful for a node based UI to allow tasks to be dragged and dropped onto the canvas.

```typescript
TaskRegistry.registerTask(MyTask);
```

The TaskQueueRegistry is used to get a queue for a given name. This is useful for when you want to run a task in a job queue. A queue can be created for a given task type, and all the tasks of that type will be added to the queue.

```typescript
// Queue management
const queue = getTaskQueueRegistry().getQueue("processing");
queue.add(new MyJobTask());
```

## Error Handling

```typescript
try {
  await task.run();
} catch (err) {
  if (err instanceof TaskAbortedError) {
    console.log("Task was aborted");
  }
}
```

## Testing

```bash
bun test
```

## Installation

```bash
bun add @ellmers/task-system
```
