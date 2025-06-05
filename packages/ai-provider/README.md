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

## Usage

### HuggingFace Transformers

```typescript
import { HF_TRANSFORMERS_ONNX, register_HFT_ClientJobFns } from "@podley/ai-provider";

// Register HuggingFace Transformers with a web worker
register_HFT_ClientJobFns(new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }));

// Or register for inline execution
import { register_HFT_InlineJobFns } from "@podley/ai-provider";
await register_HFT_InlineJobFns();
```

### TensorFlow MediaPipe

```typescript
import { TENSORFLOW_MEDIAPIPE, register_TFMP_ClientJobFns } from "@podley/ai-provider";

// Register MediaPipe with a web worker
register_TFMP_ClientJobFns(new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }));

// Or register for inline execution
import { register_TFMP_InlineJobFns } from "@podley/ai-provider";
await register_TFMP_InlineJobFns();
```

### Setting up Job Queues

```typescript
import { AiJob, AiProviderInput } from "@podley/ai";
import { JobQueue, ConcurrencyLimiter } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";
import { getTaskQueueRegistry } from "@podley/task-graph";

const queueRegistry = getTaskQueueRegistry();

// Register a queue for HuggingFace Transformers
queueRegistry.registerQueue(
  new JobQueue(HF_TRANSFORMERS_ONNX, AiJob, {
    limiter: new ConcurrencyLimiter(1, 100),
    storage: new InMemoryQueueStorage(HF_TRANSFORMERS_ONNX),
  })
);

// Register a queue for MediaPipe
queueRegistry.registerQueue(
  new JobQueue(TENSORFLOW_MEDIAPIPE, AiJob, {
    limiter: new ConcurrencyLimiter(1, 100),
    storage: new InMemoryQueueStorage(TENSORFLOW_MEDIAPIPE),
  })
);
```

## Available Providers

### HuggingFace Transformers (`hf-transformers`)

- Supports ONNX models from HuggingFace Hub
- Text generation, translation, classification, and more
- Runs locally in browser or Node.js

### TensorFlow MediaPipe (`tf-mediapipe`)

- Google's MediaPipe framework for text processing
- Optimized for performance and efficiency
- Supports various NLP tasks

## Worker Setup

For browser environments, you'll typically want to run AI inference in web workers:

```typescript
// worker.ts
import { setupHFTWorker } from "@podley/ai-provider/hf-transformers";
// or
import { setupTFMPWorker } from "@podley/ai-provider/tf-mediapipe";

setupHFTWorker();
// or
setupTFMPWorker();
```

## Dependencies

This package depends on:

- `@podley/ai` - Core AI abstractions
- `@podley/job-queue` - Job queue system
- `@podley/storage` - Storage abstractions
- `@podley/task-graph` - Task graph system
- `@podley/util` - Utility functions

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
