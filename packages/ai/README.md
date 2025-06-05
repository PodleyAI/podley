# @podley/ai

Core AI abstractions and functionality for Podley AI task pipelines.

## Overview

The `@podley/ai` package provides the core AI abstractions, job definitions, and task implementations that form the foundation of Podley's AI task execution system. It defines the interfaces and base classes that AI providers implement.

## Features

- **AI Job Abstractions**: Core job definitions for AI task execution
- **Provider Interface**: Standard interface for AI service providers
- **Task Definitions**: Base AI task types and implementations
- **Model Management**: Abstractions for AI model loading and management
- **Multi-Platform Support**: Works in browser, Node.js, and Bun environments
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
bun add @podley/ai
```

### Task Integration

```typescript
import { TextGeneration, TextClassification } from "@podley/ai";
import { Workflow } from "@podley/task-graph";

const workflow = new Workflow();

// Add AI tasks to workflow
workflow
  .TextGeneration({
    prompt: "Write a story about...",
    model: "gpt-3.5-turbo",
  })
  .TextClassification({
    text: "This is a sample text",
    labels: ["positive", "negative", "neutral"],
  });

await workflow.run();
```

## Core Components

### AiJob

The base job class for AI task execution:

- Handles provider routing
- Manages input/output validation
- Provides error handling and retry logic

### AiTask

Base class for AI-specific tasks:

- Extends the core Task class
- Adds AI-specific functionality
- Handles model loading and caching

### Model Management

- Model loading and caching abstractions
- Support for different model formats

## Task Types

The package includes several built-in AI task types:

- **Text Generation**: Generate text based on prompts
- **Text Translation**: Translate text between languages
- **Text Summarization**: Generate summaries of text
- **Text Embedding**: Generate embeddings for text
- **Text Rewriting**: Rewrite text to sound like a pirate

## Configuration

### Setup Models

- **todo**: setup models

### Setup Providers

- **todo**: setup providers

## Dependencies

This package depends on:

- `@podley/job-queue` - Job queue system
- `@podley/storage` - Storage abstractions
- `@podley/task-graph` - Task graph system
- `@podley/util` - Utility functions
- `@sinclair/typebox` - Runtime type validation

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
