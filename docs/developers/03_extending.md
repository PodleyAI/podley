# Extending the System

This document covers how to write your own tasks. For a more practical guide to getting started, see the [Developer Getting Started](./01_getting_started.md) guide. Reviewing the [Architecture](02_architecture.md) is required reading before attempting to write your own Tasks.

- [Write a new Task](#write-a-new-task)
  - [Tasks must have a `run()` method](#tasks-must-have-a-run-method)
  - [Define Inputs and Outputs](#define-inputs-and-outputs)
  - [Register the Task](#register-the-task)
- [Job Queues and LLM tasks](#job-queues-and-llm-tasks)
- [Write a new Compound Task](#write-a-new-compound-task)
- [Reactive Task UIs](#reactive-task-uis)

## Write a new Task

To write a new Task, you need to create a new class that extends the `Task` class.

### Tasks must have a `run()` method

Here we will write an example of a simple Task that prints a message to the console. Below is the starting code for the Task:

```ts
export class SimpleDebugLogTask extends Task {
  execute() {
    console.dir(<something>, { depth: null });
  }
}
```

We ran too far ahead to the main `run()` method. We need to define the inputs and outputs for the Task first.

### Define Inputs and Outputs

The first thing we need to do is define the inputs and outputs for the Task. This is done by defining the `inputSchema` and `outputSchema` static methods on the class using TypeBox schemas. Each property should include an `id` (object key), and a schema describing its type and metadata. Common types include `any`, `boolean`, `number`, `string` (text), `function`, `model`, `vector`, etc.

Here is the code for the `SimpleDebugLogTask` with the inputs defined:

```ts
type SimpleDebugLogTaskInputs = {
  message: any;
};
export class SimpleDebugLogTask extends Task<SimpleDebugLogTaskInputs> {
  public static inputSchema = () => {
    return Type.Object({
      message: Type.Any(),
    });
  };
  execute() {
    console.dir(this.runInputData.message, { depth: null });
  }
}

new SimpleDebugLogTask({ message: "hello world" }).run();
```

Since the code itself can't read the TypeScript types, we declare the runtime schemas in `inputSchema` and `outputSchema`. We still create a type `SimpleDebugLogTaskInputs` to help us since we are writing TypeScript code.

`defaults` and `runInputData` need some explanation. When we instantiate a Task, we pass in an object of input defaults which gets saved in `defaults` (and copied to `runInputData`). In the above example, that is all that happens. However, when in a graph, the outputs of other tasks can be passed in as inputs (these are called dataflows). Dataflows can add to, or override, data from the `defaults` object. The `runInputData` object is the final object that the Task will use when calling `run()`.

Since `defaults` can be 100% of the input data or 0%, we use a TypeScript Partial. Between defaults and data coming from the graph via dataflows, `runInputData` will always have all the data. If not, it is a fatal error.

It is common practice to have an output, and in a case like this, we can add an output that is the same as the input.

```ts
type SimpleDebugLogTaskInputs = {
  message: any;
};
type SimpleDebugLogTaskOutputs = {
  output: any;
};
export class SimpleDebugLogTask extends Task<SimpleDebugLogTaskInputs, SimpleDebugLogTaskOutputs> {
  public static cacheable = false;
  public static inputSchema = () => {
    return Type.Object({
      message: Type.Any({
        title: "Message",
        description: "The message to log",
      }),
    });
  };
  public static outputSchema = () => {
    return Type.Object({
      output: Type.Any({
        title: "Output",
        description: "The output of the task",
      }),
    });
  };
  execute() {
    console.dir(this.runInputData.message, { depth: null });
    this.runOutputData.output = this.runInputData.message;
    return this.runOutputData;
  }
}

new SimpleDebugLogTask({ message: "hello world" }).run();
```

In the above code, we added an output to the Task. We also added `static cacheable` flag to tell the system that this Task has side effects and should always run the execute method. This is important for the system to know if it can cache the output of the Task or not.

### Register the Task

To register the Task, you need to add it to the `TaskRegistry` class. The `TaskRegistry` class is a singleton that holds all the registered Tasks and has a `registerTask` method that takes a Task class as an argument.

```ts
TaskRegistry.registerTask(SimpleDebugLogTask);
```

To use the Task in Workflow, there are a few steps:

```ts
export const SimpleDebug = (input: DebugLogTaskInput) => {
  return new SimpleDebugTask(input).run();
};

declare module "@podley/task-graph" {
  interface Workflow {
    SimpleDebug: CreateWorkflow<DebugLogTaskInput, DebugLogTaskOutput, TaskConfig>;
  }
}

Workflow.prototype.SimpleDebug = CreateWorkflow(SimpleDebugTask);
```

## Job Queues and LLM tasks

We separate any long running tasks as Jobs. Jobs could potentially be run anywhere, either locally in the same thread, in separate threads, or on a remote server. A job queue will manage these for a single provider (like OpenAI, or a local Transformers.js ONNX runtime), and handle backoff, retries, etc.

A subclass of `JobQueueTask` will dispatch the job to the correct queue, and wait for the result. The `run()` method will return the result of the job.

Subclasses of `AiTask` are organized around a specific task. Which model is used will determine the queue to use, and is required. This abstract class will look up the model and determine the queue to use based on `AiProviderRegistry`.

To add a new embedding source, for example, you would not create a new task, but a new job queue for the new provider and then register how to run the embedding service in the `AiProviderRegistry` for the specific task, in this case `TextEmbeddingTask`. Then you use the existing `TextEmbeddingTask` with your new model name. This allows swapping out the model without changing the task, running multiple models in parallel, and so on.

## Write a new Compound Task

You can organize a group of tasks to look like one task (think of a grouping UI in an Illustrator type program). The task will build the subgraph based on the input data, and will emit a `'regenerate'` event after the subgraph has been rebuilt. This is useful for tasks that have a variable number of subtasks. An example would be the `TextEmbeddingCompoundTask` which takes a list of strings and returns a list of embeddings. Or it can take a list of models and return a list of embeddings for each model.

Compound Tasks are not cached (though any or all of their children may be).

## Reactive Task UIs

Tasks can be reactive at a certain level. This means that they can be triggered by changes in the data they depend on, without "running" the expensive job based task runs. This is useful for a UI node editor. For example, you change a color in one task and it is propagated downstream without incurring costs for re-running the entire graph. It is like a spreadsheet where changing a cell can trigger a recalculation of other cells. This is implemented via a `runReactive()` method that is called when the data changes. Typically, the `run()` will call `runReactive()` on itself at the end of the method.
