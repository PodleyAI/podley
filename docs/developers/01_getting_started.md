- [Using Workflow \& a config helper](#using-workflow--a-config-helper)
- [Using Task and TaskGraph directly (\& a config helper)](#using-task-and-taskgraph-directly--a-config-helper)
- [Using Task and TaskGraph directly (no config helper)](#using-task-and-taskgraph-directly-no-config-helper)
- [Preset Configs](#preset-configs)
  - [Registering Providers](#registering-providers)
  - [Registering Provider plus related Job Queue](#registering-provider-plus-related-job-queue)
    - [In memory:](#in-memory)
    - [Using Sqlite:](#using-sqlite)
- [Workflow](#workflow)
- [JSON Configuration](#json-configuration)
- [Tasks](#tasks)
- [TaskGraph](#taskgraph)
- [Dataflows](#dataflows)
- [Source](#source)
  - [`docs/`](#docs)
  - [`packages/storage`](#packagesstorage)
  - [`packages/job-queue`](#packagesjob-queue)
  - [`packages/task-graph`](#packagestask-graph)
  - [`packages/ai`](#packagesai)
  - [`packages/ai-provider`](#packagesai-provider)
  - [`packages/util`](#packagesutil)
  - [`examples/cli`](#examplescli)
  - [`examples/web`](#examplesweb)
  - [`examples/ngraph`](#examplesngraph)

# Developer Getting Started

This project is not yet ready to be published on npm. So for now, use the source Luke.

```bash
git clone https://github.com/sroussey/ellmers.git
cd ellmers
bun install
bun run build
cd examples/web
bun run dev
```

This will bring up a web page where you can edit some json to change the graph, and run it.

Also, you can open DevTools and edit that way (follow the instructions for enabling Console Formatters for best experience). A simple task graph workflow is available there. Just type `workflow` in the console and you can start building a graph. With the custom formatters, you can see the graph as you build it, as well as documentation. Everything self documents.

After this, plese read [Architecture](02_architecture.md) before attempting to [write your own Tasks](03_extending.md).

# Get Shit Done

## Using Workflow & a config helper

```ts
import { Workflow } from "@ellmers/task-graph";
import { register_HFT_JobFnsInMemoryQueue } from "@ellmers/test";
// config and start up
register_HFT_JobFnsInMemoryQueue();

const workflow = new Workflow();
workflow
  .DownloadModel({ model: "onnx:Xenova/LaMini-Flan-T5-783M:q8" })
  .TextRewriter({
    text: "The quick brown fox jumps over the lazy dog.",
    prompt: ["Rewrite the following text in reverse:", "Rewrite this to sound like a pirate:"],
  })
  .rename("text", "console")
  .DebugLog();
await workflow.run();

// Export the graph
const graphJson = workflow.toJSON();
console.log(graphJson);
```

## Using Task and TaskGraph directly (& a config helper)

This is equivalent to creating the graph directly, with additional features like caching and reactive execution:

```ts
import {
  DownloadModelTask,
  TextRewriterCompoundTask,
  DebugLog,
  Dataflow,
  TaskGraph,
} from "@ellmers/task-graph";
import { register_HFT_JobFnsInMemoryQueue } from "@ellmers/test";

// config and start up
register_HFT_JobFnsInMemoryQueue();

// build and run graph
const graph = new TaskGraph();
graph.addTask(new DownloadModel({ model: "onnx:Xenova/LaMini-Flan-T5-783M:q8" }, { id: "1" }));
graph.addTask(
  new TextRewriterCompoundTask(
    {
      text: "The quick brown fox jumps over the lazy dog.",
      prompt: ["Rewrite the following text in reverse:", "Rewrite this to sound like a pirate:"],
    },
    {
      id: "2",
    }
  )
);
graph.addTask(new DebugLog({}, { id: "3" }));
graph.addDataflow(
  new Dataflow({
    sourceTaskId: "1",
    sourceTaskPortId: "model",
    targetTaskId: "2",
    targetTaskPortId: "model",
  })
);
graph.addDataflow(
  new Dataflow({
    sourceTaskId: "2",
    sourceTaskPortId: "text",
    targetTaskId: "3",
    targetTaskPortId: "console",
  })
);

await graph.run();
```

## Using Task and TaskGraph directly (no config helper)

And unrolling the config helpers, we get the following equivalent code:

```ts
import {
  DebugLog,
  Dataflow,
  TaskGraph,
  ConcurrencyLimiter,
  TaskInput,
  TaskOutput,
  getTaskQueueRegistry,
} from "@ellmers/task-graph";

import {
  DownloadModelTask,
  TextRewriterCompoundTask,
  getAiProviderRegistry,
  getGlobalModelRepository,
} from "@ellmers/ai";

import {
  HuggingFaceLocal_DownloadRun,
  HuggingFaceLocal_TextRewriterRun,
} from "@ellmers/ai-provider/hf-transformers";

import { JobQueue, InMemoryRateLimiter } from "@ellmers/job-queue";
import { InMemoryQueueStorage } from "@ellmers/storage";
// config and start up
getGlobalModelRepository(new InMemoryModelRepository());
await getGlobalModelRepository().addModel({
  name: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
  url: "Xenova/LaMini-Flan-T5-783M",
  availableOnBrowser: true,
  availableOnServer: true,
  provider: HF_TRANSFORMERS_ONNX,
  pipeline: "text2text-generation",
});
await getGlobalModelRepository().connectTaskToModel(
  "TextGenerationTask",
  "onnx:Xenova/LaMini-Flan-T5-783M:q8"
);
await getGlobalModelRepository().connectTaskToModel(
  "TextRewriterTask",
  "onnx:Xenova/LaMini-Flan-T5-783M:q8"
);

const aiProviderRegistry = getAiProviderRegistry();
aiProviderRegistry.registerRunFn(
  HF_TRANSFORMERS_ONNX,
  DownloadModelTask.type,
  HuggingFaceLocal_DownloadRun
);
aiProviderRegistry.registerRunFn(
  HF_TRANSFORMERS_ONNX,
  TextRewriterTask.type,
  HuggingFaceLocal_TextRewriterRun
);
const jobQueue = new JobQueue<TaskInput, TaskOutput>("test", Job, {
  limiter: new InMemoryRateLimiter(4, 1),
  storage: new InMemoryQueueStorage<TaskInput, TaskOutput>("test"),
});
getTaskQueueRegistry().registerQueue(jobQueue);
jobQueue.start();

// build and run graph
const graph = new TaskGraph();
graph.addTask(new DownloadModel({ model: "onnx:Xenova/LaMini-Flan-T5-783M:q8" }, { id: "1" }));
graph.addTask(
  new TextRewriterCompoundTask(
    {
      text: "The quick brown fox jumps over the lazy dog.",
      prompt: ["Rewrite the following text in reverse:", "Rewrite this to sound like a pirate:"],
    },
    { id: "2" }
  )
);
graph.addTask(new DebugLog({}, { id: "3" }));
graph.addDataflow(
  new Dataflow({
    sourceTaskId: "1",
    sourceTaskPortId: "model",
    targetTaskId: "2",
    targetTaskPortId: "model",
  })
);
graph.addDataflow(
  new Dataflow({
    sourceTaskId: "2",
    sourceTaskPortId: "text",
    targetTaskId: "3",
    targetTaskPortId: "console",
  })
);

await graph.run();
```

You can use as much or as little "magic" as you want. The config helpers are there to make it easier to get started, but eventually you will want to do it yourself.

## Preset Configs

### Registering Providers

Tasks are agnostic to the provider. Text embedding can me done with several providers, such as Huggingface / ONNX or MediaPipe locally, or OpenAI etc via API calls.

- **`register_HFT_InlineJobFns()`** - Registers the Huggingface Local provider. Now you can use a onnx model name for TextEmbedding, etc.
- **`register_TFMP_InlineJobFns()`** - Registers the MediaPipe TfJs Local provider. Now you can use one of the MediaPipe models.

### Registering Provider plus related Job Queue

LLM providers have long running functions. These are handled by a Job Queue. There are some pre-built ones:

#### In memory:

- **`register_HFT_JobFnsInMemoryQueue`** function sets up the Huggingface Local provider (above), and a JobQueue with a Concurrency Limiter so the ONNX queue only runs one task/job at a time.
- **`register_TFMP_InMemoryQueue`** does the same for MediaPipe.

#### Using Sqlite:

- **`register_HFT_InlineJobFnsSqlite`** function sets up the Huggingface Local provider, and a SqliteJobQueue with a Concurrency Limiter
- **`registerMediaPipeTfJsLocalSqlite`** does the same for MediaPipe.

## Workflow

Every task in the library has a corresponding method in the Workflow. The workflow is a simple way to build a graph. It is not meant to be a full replacement for the creating a TaskGraph directly, but it is a good way to get started.

Tasks are the smallest unit of work, therefore they take simple inputs, but can indicate that they are compound tasks by having a `static isCompound` property.

An example is TextEmbeddingTask and TextEmbeddingCompoundTask. The first takes a single model input, the second accepts an array of model inputs. Since models can have different providers, the Compound version creates a single task version for each model input. The workflow is smart enough to know that the Compound version is needed when an array is passed, and as such, you don't need to differentiate between the two:

```ts
import { Workflow } from "@ellmers/task-graph";
const workflow = new Workflow();
workflow.TextEmbedding({
  model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
  text: "The quick brown fox jumps over the lazy dog.",
});
await workflow.run();
```

OR

```ts
import { Workflow } from "@ellmers/task-graph";
const workflow = new Workflow();
workflow.TextEmbedding({
  model: ["onnx:Xenova/LaMini-Flan-T5-783M:q8", "Universal Sentence Encoder"],
  text: "The quick brown fox jumps over the lazy dog.",
});
await workflow.run();
```

The workflow will look at outputs of one task and automatically connect it to the input of the next task, if the output and input names and types match. If they don't, you can use the `rename` method to rename the output of the first task to match the input of the second task.

```ts
import { Workflow } from "@ellmers/task-graph";
const workflow = new Workflow();
workflow
  .DownloadModel({
    model: ["onnx:Xenova/LaMini-Flan-T5-783M:q8", "Universal Sentence Encoder"],
  })
  .TextEmbedding({
    text: "The quick brown fox jumps over the lazy dog.",
  });
  .rename("*", "console")
  .DebugLog();
await workflow.run();
```

The first task downloads the models (this is separated mostly for ui purposes so progress on the text embedding is separate from the progress of downloading the models). The second task will take the output of the first task and use it as input, in this case the names of the models. The workflow will automatically create that data flow. The `rename` method is used to rename the `vector` output of the embedding task to match the expected `message` input of the second task.

## JSON Configuration

There is a JSONTask that can be used to build a graph. This is useful for saving and loading graphs, or for creating a graph from a JSON file. The Web example also uses this to build a graph from the JSON in the text area.

```json
[
  {
    "id": "1",
    "type": "DownloadModelCompoundTask",
    "input": {
      "model": ["onnx:Xenova/LaMini-Flan-T5-783M:q8", "onnx:Xenova/m2m100_418M:q8"]
    }
  },
  {
    "id": "2",
    "type": "TextRewriterCompoundTask",
    "input": {
      "text": "The quick brown fox jumps over the lazy dog.",
      "prompt": ["Rewrite the following text in reverse:", "Rewrite this to sound like a pirate:"]
    },
    "dependencies": {
      "model": {
        "id": "1",
        "output": "model_generation"
      }
    }
  },
  {
    "id": "3",
    "type": "TextTranslationCompoundTask",
    "input": {
      "model": "onnx:Xenova/m2m100_418M:q8",
      "source": "en",
      "target": "es"
    },
    "dependencies": {
      "text": {
        "id": "2",
        "output": "text"
      }
    }
  },
  {
    "id": "4",
    "type": "DebugLogTask",
    "input": {
      "level": "info"
    },
    "dependencies": {
      "message": [
        {
          "id": "2",
          "output": "text"
        },
        {
          "id": "3",
          "output": "text"
        }
      ]
    }
  }
]
```

The JSON above is a good example as it shows how to use a compound task with multiple inputs. Compound tasks export arrays, so use a compound task to consume the output of another compound task. The `dependencies` object is used to specify which output of which task is used as input for the current task. It is a shorthand for creating a data flow (an edge) in the graph.

```ts
import { JSONTask } from "@ellmers/task-graph";
const json = require("./example.json");
const task = new JSONTask({ json });
await task.run();
```

# Going Deeper

## Tasks

To use a task, instantiate it with some input and call `run()`:

```ts
const task = new TextEmbeddingTask({
  model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
  text: "The quick brown fox jumps over the lazy dog.",
});
const result = await task.run();
console.log(result);
```

You will notice that the workflow automatically creates ids for you, so it assumes that the object parameter is the input object. Using a task directly, you need to specify input object directly as above.

## TaskGraph

The task graph is a collection of tasks (nodes) and data flows (edges). It is the heart of using the library.

Example:

```ts
const graph = new TaskGraph();
graph.addTask(
  new TextRewriterCompoundTask({
    model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
    text: "The quick brown fox jumps over the lazy dog.",
    prompt: ["Rewrite the following text in reverse:", "Rewrite this to sound like a pirate:"],
  })
);
```

## Dataflows

Dataflows are the edges in the graph. They connect the output of one task to the input of another. They are created by specifying the source and target tasks and the output and input ids.

Example, adding a data flow to the graph similar to above:

```ts
const graph = new TaskGraph();
graph.addTask(
  new TextRewriterCompoundTask(
    {
      model: "onnx:Xenova/LaMini-Flan-T5-783M:q8",
      text: "The quick brown fox jumps over the lazy dog.",
      prompt: ["Rewrite the following text in reverse:", "Rewrite this to sound like a pirate:"],
    },
    { id: "1" }
  )
);
graph.addTask(new DebugLogTask({}, { id: "2" }));
graph.addDataflow(
  new Dataflow({
    sourceTaskId: "1",
    sourceTaskPortId: "text",
    targetTaskId: "2",
    targetTaskPortId: "message",
  })
);
```

This links the output of the TextRewriterCompoundTask (id 1) to the input of the DebugLogTask (id 2). The output of the TextRewriterCompoundTask is the `text` field, and the input of the DebugLogTask is the `message` field.

# Appendix

## Source

### `docs/`

You are here.

### `packages/storage`

Simple KV storage with multiple backends.

### `packages/job-queue`

This is a simple job queue implementation with a concurrency limiters and multiple backends.

### `packages/task-graph`

This is the main task handling library, with tasks, compound tasks, data flows, etc. Is uses the job queue for long running tasks, and it has ways to cache results using the storage layer.

### `packages/ai`

These are the LLM tasks, models, etc. These tasks are agnostic to the provider and thus are like abstract versions. AI Proivders contribute the concrete implementations. Which implmentation is used is determined by the model repository.

### `packages/ai-provider`

This is the Huggingface Transformers JS (using ONNX) and TensorFlow MediaPipe providers.

### `packages/util`

This is a collection of utility functions.

### `examples/cli`

An example project that uses the library in a CLI settings using listr2 (`cat example.json | ellmers json`, for example)

![cli example](img/cli.png)

### `examples/web`

An example project that uses the library in a web setting, running locally in browser.

![web example](img/web.png)

Don't forget to open the console for some goodies.

### `examples/ngraph`

A graph editor tool that uses ngraph. It is not yet ready for prime time.

![ngraph example](img/ngraph.png)
