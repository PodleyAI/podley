# @podley/ai

Core AI abstractions and functionality for Podley AI task pipelines.

## Overview

The `@podley/ai` package provides the core AI abstractions, job definitions, and task implementations that form the foundation of Podley's AI task execution system. It defines the interfaces and base classes that AI providers implement, along with a comprehensive set of AI tasks ready for use.

## Features

- **9 Built-in AI Tasks**: Pre-implemented tasks for common AI operations
- **Provider Interface**: Standard interface for AI service providers
- **Model Management**: Complete system for managing AI models and their associations with tasks
- **Multi-Platform Support**: Works in browser, Node.js, and Bun environments
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Multiple Storage Backends**: In-memory, IndexedDB, SQLite, and PostgreSQL support

## Installation

```bash
bun add @podley/ai
```

## Quick Start

Here's a complete example of setting up and using the AI package:

```typescript
import { 
  TextGenerationTask, 
  TextEmbeddingTask,
  getGlobalModelRepository,
  getAiProviderRegistry,
  setGlobalModelRepository,
  InMemoryModelRepository 
} from "@podley/ai";
import { Workflow, getTaskQueueRegistry } from "@podley/task-graph";
import { InMemoryJobQueue } from "@podley/job-queue";

// 1. Set up a model repository
const modelRepo = new InMemoryModelRepository();
setGlobalModelRepository(modelRepo);

// 2. Add models to the repository
await modelRepo.addModel({
  name: "gpt-3.5-turbo",
  url: "https://api.openai.com/v1/chat/completions",
  provider: "openai",
  availableOnBrowser: true,
  availableOnServer: true,
  contextWindow: 4096,
});

// 3. Connect models to tasks
await modelRepo.connectTaskToModel("TextGenerationTask", "gpt-3.5-turbo");

// 4. Register AI provider functions
const registry = getAiProviderRegistry();
registry.registerRunFn("openai", "TextGenerationTask", async (input, model, updateProgress, signal) => {
  // Your OpenAI API call implementation here
  const response = await fetch(model.url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: input.model,
      messages: [{ role: 'user', content: input.prompt }],
      max_tokens: input.maxTokens || 150,
      temperature: input.temperature || 0.7
    })
  });
  const data = await response.json();
  return { text: data.choices[0].message.content };
});

// 5. Set up job queue for the provider
getTaskQueueRegistry().setQueue("openai", new InMemoryJobQueue("openai"));

// 6. Create and run a workflow
const workflow = new Workflow();

const result = await workflow
  .TextGenerationTask({
    model: "gpt-3.5-turbo",
    prompt: "Write a short story about a robot learning to paint.",
    maxTokens: 200,
    temperature: 0.8
  })
  .run();

console.log(result.text);
```

## Available AI Tasks

### Text Processing Tasks

#### TextGenerationTask
Generates text based on prompts using language models.

```typescript
import { TextGenerationTask } from "@podley/ai";

const task = new TextGenerationTask({
  model: "gpt-3.5-turbo",
  prompt: "Explain quantum computing in simple terms",
  maxTokens: 150,
  temperature: 0.7,
  topP: 0.9
});

const result = await task.run();
// Output: { text: "Quantum computing is..." }
```

#### TextEmbeddingTask
Generates vector embeddings for text using embedding models.

```typescript
import { TextEmbeddingTask } from "@podley/ai";

const task = new TextEmbeddingTask({
  model: "text-embedding-ada-002",
  text: "This is a sample text for embedding"
});

const result = await task.run();
// Output: { vector: [0.1, -0.2, 0.3, ...] }
```

#### TextTranslationTask
Translates text between different languages.

```typescript
import { TextTranslationTask } from "@podley/ai";

const task = new TextTranslationTask({
  model: "translation-model",
  text: "Hello, how are you?",
  sourceLanguage: "en",
  targetLanguage: "es"
});

const result = await task.run();
// Output: { translatedText: "Hola, ¿cómo estás?" }
```

#### TextSummaryTask
Generates summaries of longer text content.

```typescript
import { TextSummaryTask } from "@podley/ai";

const task = new TextSummaryTask({
  model: "gpt-3.5-turbo",
  text: "Long article content here...",
  maxLength: 100
});

const result = await task.run();
// Output: { summary: "Brief summary of the article..." }
```

#### TextRewriterTask
Rewrites text in different styles or tones.

```typescript
import { TextRewriterTask } from "@podley/ai";

const task = new TextRewriterTask({
  model: "gpt-3.5-turbo",
  text: "This is a formal business proposal.",
  style: "casual"
});

const result = await task.run();
// Output: { rewrittenText: "This is a casual business idea..." }
```

#### TextQuestionAnswerTask
Answers questions based on provided context.

```typescript
import { TextQuestionAnswerTask } from "@podley/ai";

const task = new TextQuestionAnswerTask({
  model: "gpt-3.5-turbo",
  context: "The capital of France is Paris. It has a population of about 2.1 million.",
  question: "What is the population of Paris?"
});

const result = await task.run();
// Output: { answer: "About 2.1 million" }
```

### Analysis Tasks

#### SimilarityTask
Computes similarity between texts or embeddings.

```typescript
import { SimilarityTask } from "@podley/ai";

const task = new SimilarityTask({
  model: "text-embedding-ada-002",
  text1: "I love programming",
  text2: "Coding is my passion"
});

const result = await task.run();
// Output: { similarity: 0.85 }
```

### Document Processing Tasks

#### DocumentSplitterTask
Splits documents into smaller chunks for processing.

```typescript
import { DocumentSplitterTask } from "@podley/ai";

const task = new DocumentSplitterTask({
  document: "Very long document content...",
  chunkSize: 1000,
  chunkOverlap: 200
});

const result = await task.run();
// Output: { chunks: ["chunk1...", "chunk2...", "chunk3..."] }
```

### Model Management Tasks

#### DownloadModelTask
Downloads and prepares AI models for use.

```typescript
import { DownloadModelTask } from "@podley/ai";

const task = new DownloadModelTask({
  modelName: "text-embedding-ada-002",
  modelUrl: "https://huggingface.co/model-url",
  provider: "hf-transformers"
});

const result = await task.run();
// Output: { status: "downloaded", path: "/models/..." }
```

## Model Management

### Setting Up Models

Models are managed through the `ModelRepository` system. You can use different storage backends:

#### In-Memory Repository (Development)
```typescript
import { InMemoryModelRepository, setGlobalModelRepository } from "@podley/ai";

const modelRepo = new InMemoryModelRepository();
setGlobalModelRepository(modelRepo);
```

#### IndexedDB Repository (Browser)
```typescript
import { IndexedDbModelRepository, setGlobalModelRepository } from "@podley/ai";

const modelRepo = new IndexedDbModelRepository("models", "task2models");
setGlobalModelRepository(modelRepo);
```

#### SQLite Repository (Server)
```typescript
import { SqliteModelRepository, setGlobalModelRepository } from "@podley/ai";

const modelRepo = new SqliteModelRepository("./models.db");
setGlobalModelRepository(modelRepo);
```

#### PostgreSQL Repository (Production)
```typescript
import { PostgresModelRepository, setGlobalModelRepository } from "@podley/ai";
import { Pool } from "pg";

const pool = new Pool({
  user: 'username',
  host: 'localhost',
  database: 'mydb',
  password: 'password',
  port: 5432,
});

const modelRepo = new PostgresModelRepository(pool);
setGlobalModelRepository(modelRepo);
```

### Adding Models

```typescript
import { getGlobalModelRepository } from "@podley/ai";

const modelRepo = getGlobalModelRepository();

// Add a model
await modelRepo.addModel({
  name: "gpt-4",
  url: "https://api.openai.com/v1/chat/completions",
  provider: "openai",
  availableOnBrowser: true,
  availableOnServer: true,
  contextWindow: 8192,
  numParameters: 175000000000
});

// Connect model to specific tasks
await modelRepo.connectTaskToModel("TextGenerationTask", "gpt-4");
await modelRepo.connectTaskToModel("TextSummaryTask", "gpt-4");

// Find models for a specific task
const textGenModels = await modelRepo.findModelsByTask("TextGenerationTask");
```

## Provider Setup

AI providers handle the actual execution of AI tasks. You need to register provider functions for each model provider and task type combination.

### Basic Provider Registration

```typescript
import { getAiProviderRegistry } from "@podley/ai";

const registry = getAiProviderRegistry();

// Register a function for OpenAI text generation
registry.registerRunFn("openai", "TextGenerationTask", async (input, model, updateProgress, signal) => {
  updateProgress(0, "Starting generation...");
  
  const response = await fetch(model.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.model,
      messages: [{ role: 'user', content: input.prompt }],
      max_tokens: input.maxTokens,
      temperature: input.temperature
    }),
    signal // Pass abort signal for cancellation
  });
  
  updateProgress(50, "Processing response...");
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  updateProgress(100, "Complete");
  
  return { text: data.choices[0].message.content };
});
```

### Worker-Based Provider Registration

For compute-intensive tasks that should run in workers:

```typescript
// Register as worker function (will run in separate worker thread)
registry.registerAsWorkerRunFn("hf-transformers", "TextEmbeddingTask");
```

### Job Queue Setup

Each provider needs a job queue for task execution:

```typescript
import { getTaskQueueRegistry } from "@podley/task-graph";
import { InMemoryJobQueue } from "@podley/job-queue";

// Set up job queues for each provider
getTaskQueueRegistry().setQueue("openai", new InMemoryJobQueue("openai"));
getTaskQueueRegistry().setQueue("hf-transformers", new InMemoryJobQueue("hf-transformers"));
```

## Workflow Integration

AI tasks integrate seamlessly with Podley workflows:

```typescript
import { Workflow } from "@podley/task-graph";
import { TextGenerationTask, TextEmbeddingTask, SimilarityTask } from "@podley/ai";

const workflow = new Workflow();

// Chain AI tasks together
const result = await workflow
  .TextGenerationTask({
    model: "gpt-3.5-turbo",
    prompt: "Write about artificial intelligence"
  })
  .TextEmbeddingTask({
    model: "text-embedding-ada-002",
    text: workflow.previous().text // Use previous task output
  })
  .SimilarityTask({
    model: "text-embedding-ada-002",
    text1: "artificial intelligence",
    embedding2: workflow.previous().vector // Use embedding from previous task
  })
  .run();

console.log("Final similarity score:", result.similarity);
```

## Document Processing

The package includes document processing capabilities:

```typescript
import { Document, DocumentConverterMarkdown } from "@podley/ai";

// Create a document
const doc = new Document("# My Document\n\nThis is content...", { title: "Sample Doc" });

// Convert markdown to structured format
const converter = new DocumentConverterMarkdown();
const processedDoc = await converter.convert(doc);

// Use with document splitter
const splitter = new DocumentSplitterTask({
  document: processedDoc.content,
  chunkSize: 500,
  chunkOverlap: 50
});

const chunks = await splitter.run();
```

## Error Handling

AI tasks include comprehensive error handling:

```typescript
import { TaskConfigurationError } from "@podley/task-graph";

try {
  const task = new TextGenerationTask({
    model: "nonexistent-model",
    prompt: "Test prompt"
  });
  
  const result = await task.run();
} catch (error) {
  if (error instanceof TaskConfigurationError) {
    console.error("Configuration error:", error.message);
    // Handle missing model, invalid parameters, etc.
  } else {
    console.error("Runtime error:", error.message);
    // Handle API failures, network issues, etc.
  }
}
```

## Advanced Configuration

### Custom Model Validation

Tasks automatically validate that specified models exist and are compatible:

```typescript
// Models are validated before task execution
const task = new TextGenerationTask({
  model: "gpt-4", // Must exist in ModelRepository and be connected to TextGenerationTask
  prompt: "Generate text"
});

// Validation happens during task.run()
```

### Progress Tracking

Monitor AI task progress:

```typescript
const task = new TextGenerationTask({
  model: "gpt-3.5-turbo",
  prompt: "Long generation task..."
});

task.on('progress', (progress, message, details) => {
  console.log(`Progress: ${progress}% - ${message}`);
});

const result = await task.run();
```

### Task Cancellation

All AI tasks support cancellation via AbortSignal:

```typescript
const controller = new AbortController();

const task = new TextGenerationTask({
  model: "gpt-3.5-turbo",
  prompt: "Generate text..."
});

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000);

try {
  const result = await task.run({ signal: controller.signal });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Task was cancelled');
  }
}
```

## Environment-Specific Usage

### Browser Usage
```typescript
import { IndexedDbModelRepository } from "@podley/ai/browser";

// Use IndexedDB for persistent storage in browser
const modelRepo = new IndexedDbModelRepository();
```

### Node.js Usage
```typescript
import { SqliteModelRepository } from "@podley/ai/node";

// Use SQLite for server-side storage
const modelRepo = new SqliteModelRepository("./models.db");
```

### Bun Usage
```typescript
import { InMemoryModelRepository } from "@podley/ai/bun";

// Direct imports work with Bun
const modelRepo = new InMemoryModelRepository();
```

## Dependencies

This package depends on:

- `@podley/job-queue` - Job queue system for task execution
- `@podley/storage` - Storage abstractions for model and data persistence
- `@podley/task-graph` - Task graph system for workflow management
- `@podley/util` - Utility functions and shared components
- `@sinclair/typebox` - Runtime type validation and schema definitions

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
