# @podley/ai-provider

AI provider implementations for Podley AI task pipelines.

## Overview

The `@podley/ai-provider` package provides concrete implementations of AI providers that can be used with Podley's task execution system. It includes support for various AI services and local model execution frameworks.

## Features

- **HuggingFace Transformers**: Support for ONNX models via HuggingFace Transformers.js
- **TensorFlow MediaPipe**: Integration with Google's MediaPipe for text processing tasks
- [FUTURE] **OpenAI Integration**: Support for OpenAI API services
- [FUTURE] **GGML Support**: Local model execution with GGML format models
- **Multi-Platform**: Works in browser, Node.js, and Bun environments
- **Worker Support**: Offload AI computation to web workers for better performance
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @podley/ai-provider
# or
bun add @podley/ai-provider
```

## Peer Dependencies

Depending on which providers you use, you may need to install additional peer dependencies:

```bash
# For HuggingFace Transformers support
npm install @sroussey/transformers

# For MediaPipe support
npm install @mediapipe/tasks-text
```

## Quick Start

### 1. Basic Setup

```typescript
import {
  HF_TRANSFORMERS_ONNX,
  TENSORFLOW_MEDIAPIPE,
  register_HFT_InlineJobFns,
  register_TFMP_InlineJobFns,
} from "@podley/ai-provider";
import { getTaskQueueRegistry } from "@podley/task-graph";
import { AiJob } from "@podley/ai";
import { JobQueue, ConcurrencyLimiter } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

// Register AI providers
await register_HFT_InlineJobFns();
register_TFMP_InlineJobFns();

// Set up job queues
const queueRegistry = getTaskQueueRegistry();

queueRegistry.registerQueue(
  new JobQueue(HF_TRANSFORMERS_ONNX, AiJob, {
    limiter: new ConcurrencyLimiter(1, 100),
    storage: new InMemoryQueueStorage(HF_TRANSFORMERS_ONNX),
  })
);

queueRegistry.registerQueue(
  new JobQueue(TENSORFLOW_MEDIAPIPE, AiJob, {
    limiter: new ConcurrencyLimiter(1, 100),
    storage: new InMemoryQueueStorage(TENSORFLOW_MEDIAPIPE),
  })
);
```

### 2. Using AI Tasks in Workflows

```typescript
import {
  TextGenerationTask,
  TextEmbeddingTask,
  TextTranslationTask,
  TextSummaryTask,
} from "@podley/ai";
import { Workflow } from "@podley/task-graph";

const workflow = new Workflow();

// Add AI tasks to your workflow
const result = await workflow
  .add(
    new TextGenerationTask({
      model: "Xenova/gpt2",
      prompt: "The future of AI is",
    })
  )
  .add(
    new TextEmbeddingTask({
      model: "Xenova/all-MiniLM-L6-v2",
      text: "Hello world",
    })
  )
  .run();
```

## Available Providers

### HuggingFace Transformers (`HF_TRANSFORMERS_ONNX`)

Supports ONNX models from HuggingFace Hub with the following task types:

#### Supported Tasks

- **TextGenerationTask**: Generate text from prompts
- **TextEmbeddingTask**: Generate vector embeddings for text
- **TextTranslationTask**: Translate text between languages
- **TextSummaryTask**: Summarize long text
- **TextRewriterTask**: Rewrite text with a given prompt
- **TextQuestionAnswerTask**: Answer questions based on context
- **DownloadModelTask**: Pre-download and cache models

#### Model Configuration

Models support various quantization options:

```typescript
import { QUANTIZATION_DATA_TYPES } from "@podley/ai-provider";

// Quantization options
// "auto" - Auto-detect based on environment
// "fp32" - 32-bit floating point
// "fp16" - 16-bit floating point
// "q8" - 8-bit quantized
// "int8" - 8-bit integer
// "uint8" - 8-bit unsigned integer
// "q4" - 4-bit quantized
// "bnb4" - BitsAndBytes 4-bit
// "q4f16" - fp16 model with int4 block weight quantization
```

#### Task Examples

**Text Generation:**

```typescript
import { TextGenerationTask } from "@podley/ai";

const task = new TextGenerationTask({
  model: "Xenova/gpt2",
  prompt: "Once upon a time",
  maxTokens: 50,
  temperature: 0.7,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
});

const result = await task.execute();
// result.text: string - Generated text
```

**Text Embedding:**

```typescript
import { TextEmbeddingTask } from "@podley/ai";

const task = new TextEmbeddingTask({
  model: "Xenova/all-MiniLM-L6-v2",
  text: "This is a sample text for embedding",
});

const result = await task.execute();
// result.vector: TypedArray - Vector embedding
```

**Text Translation:**

```typescript
import { TextTranslationTask } from "@podley/ai";

const task = new TextTranslationTask({
  model: "Xenova/t5-small",
  text: "Hello world",
  source_lang: "en",
  target_lang: "fr",
});

const result = await task.execute();
// result.text: string - Translated text
// result.target_lang: string - Target language
```

**Text Summary:**

```typescript
import { TextSummaryTask } from "@podley/ai";

const task = new TextSummaryTask({
  model: "Xenova/distilbart-cnn-6-6",
  text: "Long text to summarize...",
});

const result = await task.execute();
// result.text: string - Summary text
```

**Text Rewriter:**

```typescript
import { TextRewriterTask } from "@podley/ai";

const task = new TextRewriterTask({
  model: "Xenova/gpt2",
  text: "The weather is nice today",
  prompt: "Rewrite this as a pirate would say it",
});

const result = await task.execute();
// result.text: string - Rewritten text
```

**Question Answering:**

```typescript
import { TextQuestionAnswerTask } from "@podley/ai";

const task = new TextQuestionAnswerTask({
  model: "Xenova/distilbert-base-uncased-distilled-squad",
  context: "The capital of France is Paris. It is known for the Eiffel Tower.",
  question: "What is the capital of France?",
});

const result = await task.execute();
// result.text: string - Answer text
```

### TensorFlow MediaPipe (`TENSORFLOW_MEDIAPIPE`)

Optimized for performance using Google's MediaPipe framework.

#### Supported Tasks

- **TextEmbeddingTask**: Generate vector embeddings for text
- **DownloadModelTask**: Pre-download and cache models

#### Example

```typescript
import { TextEmbeddingTask } from "@podley/ai";

const task = new TextEmbeddingTask({
  model: "path/to/mediapipe/model.tflite",
  text: "Text to embed",
});

const result = await task.execute();
// result.vector: Float32Array - Vector embedding
```

## Advanced Usage

### Worker Setup

For better performance, especially in browser environments, run AI inference in web workers:

#### Main Thread Setup

```typescript
import { register_HFT_ClientJobFns, register_TFMP_ClientJobFns } from "@podley/ai-provider";

// Register HuggingFace Transformers with worker
register_HFT_ClientJobFns(
  new Worker(new URL("./hft-worker.ts", import.meta.url), { type: "module" })
);

// Register MediaPipe with worker
register_TFMP_ClientJobFns(
  new Worker(new URL("./tfmp-worker.ts", import.meta.url), { type: "module" })
);
```

#### Worker Setup Files

**hft-worker.ts:**

```typescript
import { register_HFT_WorkerJobFns } from "@podley/ai-provider";

// Register HuggingFace Transformers worker functions
register_HFT_WorkerJobFns();
```

**tfmp-worker.ts:**

```typescript
import { register_TFMP_WorkerJobFns } from "@podley/ai-provider";

// Register MediaPipe worker functions
register_TFMP_WorkerJobFns();
```

### Model Management

```typescript
import { getGlobalModelRepository } from "@podley/ai";
import { DownloadModelTask } from "@podley/ai";

// Pre-download models
const downloadTask = new DownloadModelTask({
  model: "Xenova/all-MiniLM-L6-v2",
});

await downloadTask.execute();

// Models are automatically cached for subsequent use
```

### Custom Job Queue Configuration

```typescript
import { JobQueue, ConcurrencyLimiter, DelayLimiter } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

// Configure queue with custom limits
const customQueue = new JobQueue(HF_TRANSFORMERS_ONNX, AiJob, {
  limiter: new ConcurrencyLimiter(2, 1000), // 2 concurrent jobs, 1000ms timeout
  storage: new InMemoryQueueStorage(HF_TRANSFORMERS_ONNX),
});
```

### Error Handling

```typescript
import { PermanentJobError, AbortSignalJobError } from "@podley/job-queue";

try {
  const task = new TextGenerationTask({
    model: "invalid-model",
    prompt: "Test",
  });

  await task.execute();
} catch (error) {
  if (error instanceof PermanentJobError) {
    console.error("Permanent error:", error.message);
  } else if (error instanceof AbortSignalJobError) {
    console.error("Task was aborted");
  }
}
```

### Progress Tracking

```typescript
const task = new TextGenerationTask({
  model: "Xenova/gpt2",
  prompt: "Generate text...",
});

// Listen for progress updates
task.on("progress", (progress, message, details) => {
  console.log(`Progress: ${progress}% - ${message}`, details);
});

await task.execute();
```

## Complete Working Example

```typescript
import { HF_TRANSFORMERS_ONNX, register_HFT_InlineJobFns } from "@podley/ai-provider";
import { TextGenerationTask, TextEmbeddingTask, AiJob } from "@podley/ai";
import { Workflow, getTaskQueueRegistry } from "@podley/task-graph";
import { JobQueue, ConcurrencyLimiter } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

async function main() {
  // 1. Register the AI provider
  await register_HFT_InlineJobFns();

  // 2. Set up job queue
  const queueRegistry = getTaskQueueRegistry();
  queueRegistry.registerQueue(
    new JobQueue(HF_TRANSFORMERS_ONNX, AiJob, {
      limiter: new ConcurrencyLimiter(1, 100),
      storage: new InMemoryQueueStorage(HF_TRANSFORMERS_ONNX),
    })
  );

  // 3. Create and run workflow
  const workflow = new Workflow();

  const result = await workflow
    .add(
      new TextGenerationTask({
        model: "Xenova/gpt2",
        prompt: "The benefits of AI include",
        maxTokens: 50,
      })
    )
    .add(
      new TextEmbeddingTask({
        model: "Xenova/all-MiniLM-L6-v2",
        text: "AI is transforming the world",
      })
    )
    .run();

  console.log("Generated text:", result.outputs[0].text);
  console.log("Embedding dimensions:", result.outputs[1].vector.length);
}

main().catch(console.error);
```

## Task Input/Output Schemas

### Common Types

```typescript
// Model reference (string)
model: string

// Text input/output
text: string

// Vector embedding (typed array)
vector: Float32Array | Float64Array | Int32Array | etc.

// Language codes (ISO 639-1)
source_lang: string  // e.g., "en", "fr", "es"
target_lang: string
```

### Task Schemas Summary

| Task                       | Input                                                                                     | Output                  |
| -------------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| **TextGenerationTask**     | `{ model, prompt, maxTokens?, temperature?, topP?, frequencyPenalty?, presencePenalty? }` | `{ text }`              |
| **TextEmbeddingTask**      | `{ model, text }`                                                                         | `{ vector }`            |
| **TextTranslationTask**    | `{ model, text, source_lang, target_lang }`                                               | `{ text, target_lang }` |
| **TextSummaryTask**        | `{ model, text }`                                                                         | `{ text }`              |
| **TextRewriterTask**       | `{ model, text, prompt }`                                                                 | `{ text }`              |
| **TextQuestionAnswerTask** | `{ model, context, question }`                                                            | `{ text }`              |
| **DownloadModelTask**      | `{ model }`                                                                               | `{ model }`             |

## Popular Models

### HuggingFace Transformers Models

**Text Generation:**

- `Xenova/gpt2` - GPT-2 text generation
- `Xenova/distilgpt2` - Smaller GPT-2 variant

**Text Embedding:**

- `Xenova/all-MiniLM-L6-v2` - General purpose embeddings
- `Xenova/all-mpnet-base-v2` - High quality embeddings

**Translation:**

- `Xenova/t5-small` - Multilingual translation
- `Xenova/marian-mt-en-fr` - English to French

**Summarization:**

- `Xenova/distilbart-cnn-6-6` - News summarization
- `Xenova/t5-small` - General summarization

**Question Answering:**

- `Xenova/distilbert-base-uncased-distilled-squad` - SQuAD trained

## Dependencies

This package depends on:

- `@podley/ai` - Core AI abstractions
- `@podley/job-queue` - Job queue system
- `@podley/storage` - Storage abstractions
- `@podley/task-graph` - Task graph system
- `@podley/util` - Utility functions

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
