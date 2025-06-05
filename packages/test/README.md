# @podley/test

Testing utilities and sample data for Podley AI task pipelines.

## Overview

The `@podley/test` package provides testing utilities, sample data, and in-memory implementations for developing and testing Podley AI applications. It includes mock repositories, sample task configurations, and helper functions for setting up test environments.

## Features

- **In-Memory Repositories**: Mock implementations of task graph and output repositories for testing
- **Sample Data**: Pre-configured sample tasks and workflows for testing and development
- **Test Bindings**: Helper functions for setting up test environments
- **Multi-Platform Support**: Works in browser, Node.js, and Bun environments

## Installation

```bash
npm install @podley/test
# or
bun add @podley/test
```

## Usage

### In-Memory Repositories

```typescript
import { InMemoryTaskGraphRepository, InMemoryTaskOutputRepository } from "@podley/test";

// Create in-memory repositories for testing
const taskGraphRepo = new InMemoryTaskGraphRepository();
const taskOutputRepo = new InMemoryTaskOutputRepository();
```

### Sample Data and Models

```typescript
import { registerHuggingfaceLocalModels, registerMediaPipeTfJsLocalModels } from "@podley/test";

// Register sample AI models for testing
await registerHuggingfaceLocalModels();
await registerMediaPipeTfJsLocalModels();
```

### Test Queue Setup

```typescript
import { register_HFT_InMemoryQueue, register_TFMP_InMemoryQueue } from "@podley/test";

// Set up in-memory queues for testing
await register_HFT_InMemoryQueue();
await register_TFMP_InMemoryQueue();
```

## API Reference

### Repositories

- `InMemoryTaskGraphRepository` - In-memory implementation of task graph storage
- `InMemoryTaskOutputRepository` - In-memory implementation of task output storage
- `IndexedDbTaskGraphRepository` - Browser-based IndexedDB storage for task graphs
- `IndexedDbTaskOutputRepository` - Browser-based IndexedDB storage for task outputs

### Sample Registration Functions

- `registerHuggingfaceLocalModels()` - Registers sample HuggingFace models
- `registerMediaPipeTfJsLocalModels()` - Registers sample MediaPipe TensorFlow.js models
- `register_HFT_InMemoryQueue()` - Sets up HuggingFace Transformers in-memory queue
- `register_TFMP_InMemoryQueue()` - Sets up TensorFlow MediaPipe in-memory queue

## Dependencies

This package depends on other Podley packages:

- `@podley/ai`
- `@podley/ai-provider`
- `@podley/job-queue`
- `@podley/storage`
- `@podley/task-graph`
- `@podley/tasks`
- `@podley/util`
- `@podley/sqlite`

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
