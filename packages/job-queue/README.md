# @podley/job-queue

A simple job queue system for managing and processing asynchronous tasks with rate limiting, and cross-platform persistence.

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
  - [Creating a Queue](#creating-a-queue)
  - [Queue Lifecycle](#queue-lifecycle)
  - [Adding Jobs](#adding-jobs)
  - [Job Events](#job-events)
- [Rate Limiting Strategies](#rate-limiting-strategies)
  - [Composite Limiter](#composite-limiter)
  - [Rate Limiter](#rate-limiter)
  - [Concurrency Limiter](#concurrency-limiter)
  - [Delay Limiter](#delay-limiter)
- [Storage Backends](#storage-backends)
  - [InMemory (Anywhere)](#inmemory-anywhere)
  - [IndexedDB (Browser)](#indexeddb-browser)
  - [Sqlite (Node.js/Bun)](#sqlite-nodejsbun)
  - [PostgreSQL (Node.js/Bun)](#postgresql-nodejsbun)
- [API Overview](#api-overview)
  - [Core Classes](#core-classes)
  - [Rate Limiters](#rate-limiters)
  - [Storage Implementations](#storage-implementations)
- [Testing](#testing)
- [License](#license)

## Features

- Multiple storage backends (In-Memory, IndexedDB, SQLite, PostgreSQL)
- Rate limiting strategies (Concurrency, Delay, Composite)
- Job prioritization and retry logic
- Progress tracking and event listeners
- Cross-platform support (Browser, Node.js, Bun)
- TypeScript-first implementation

## Installation

```bash
bun add @podley/job-queue
```

## Basic Usage

### Creating a Queue

```typescript
import { Job, InMemoryJobQueue } from "@podley/job-queue";

// Define your job type
interface MyJobInput {
  data: string;
}
interface MyJobOutput {
  result: number;
}

class MyJob extends Job<MyJobInput, MyJobOutput> {
  async execute(input: MyJobInput): Promise<MyJobOutput> {
    return { result: input.data.length };
  }
}

// Create queue with in-memory storage
const queue = new InMemoryJobQueue<MyJobInput, MyJobOutput, MyJob>("my-queue", MyJob, {
  limiter: new ConcurrencyLimiter(5), // 5 concurrent jobs
  deleteAfterCompletionMs: 60_000, // clean up completed jobs after 1 minute
  deleteAfterFailureMs: 86_400_000, // clean up failed jobs after 1 day
});

await queue.start();
```

### Queue Lifecycle

```typescript
await queue.start();
```

```typescript
await queue.stop();
```

```typescript
await queue.reset();
```

### Adding Jobs

```typescript
const job = new Job({
  input: { data: "process-me" },
  maxRetries: 3,
});

const jobId = await queue.add(job);
```

### Job Events

```typescript
queue.on("job_start", (queueName, jobId) => {
  console.log(`Job ${jobId} started in ${queueName}`);
});

queue.on("job_progress", (queueName, jobId, progress) => {
  console.log(`Job ${jobId} progress: ${progress}%`);
});
```

## Rate Limiting Strategies

### Composite Limiter

```typescript
import { CompositeLimiter, ConcurrencyLimiter, DelayLimiter } from "@podley/job-queue";

const limiter = new CompositeLimiter([
  new ConcurrencyLimiter(5), // Max 5 concurrent jobs
  new DelayLimiter(100), // Minimum 100ms between job starts
]);
```

### Rate Limiter

- `InMemoryRateLimiter` - Rate limiter using in-memory storage
- `SqliteRateLimiter` - Rate limiter using SQLite storage
- `PostgresRateLimiter` - Rate limiter using PostgreSQL storage

### Concurrency Limiter

```typescript
import { ConcurrencyLimiter } from "@podley/job-queue";

const limiter = new ConcurrencyLimiter(15); // Max 15 jobs at a time
```

### Delay Limiter

```typescript
import { DelayLimiter } from "@podley/job-queue";

const limiter = new DelayLimiter(100); // Minimum 100ms between job starts
```

## Storage Backends

### InMemory (Anywhere)

```typescript
import { Job, InMemoryJobQueue, InMemoryRateLimiter } from "@podley/job-queue";

const queue = new InMemoryJobQueue<MyJobInput, MyJobOutput>("browser-queue", Job, {
  limiter: new InMemoryRateLimiter({ maxExecutions: 10, windowSizeInSeconds: 1 }),
});

// equivalent example on how to use the storage class directly

import { Job, JobQueue, InMemoryRateLimiter } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

const queue = new JobQueue<MyJobInput, MyJobOutput>("browser-queue", Job, {
  storage: new InMemoryQueueStorage("browser-queue"),
  limiter: new InMemoryRateLimiter({ maxExecutions: 10, windowSizeInSeconds: 1 }),
});
```

### IndexedDB (Browser)

```typescript
import { IndexedDbJobQueue, IndexedDbRateLimiter } from "@podley/job-queue";

const queue = new IndexedDbJobQueue<MyJobInput, MyJobOutput>("browser-queue", Job, {
  limiter: new InMemoryRateLimiter({ maxExecutions: 10, windowSizeInSeconds: 1 }),
});
```

### Sqlite (Node.js/Bun)

```typescript
import { SqliteJobQueue, SqliteRateLimiter } from "@podley/job-queue";

const queue = new SqliteJobQueue(db, "sqlite-queue", Job, {
  limiter: new SqliteRateLimiter({ maxExecutions: 10, windowSizeInSeconds: 1 }),
});
```

### PostgreSQL (Node.js/Bun)

```typescript
import { PostgresJobQueue, PostgresRateLimiter } from "@podley/job-queue";

const queue = new PostgresJobQueue(postgresPool, "pg-queue", Job, {
  limiter: new PostgresRateLimiter({ maxExecutions: 10, windowSizeInSeconds: 1 }),
});
```

## API Overview

### Core Classes

- `Job`: Base job class with progress tracking and retry logic
- `JobQueue`: Main queue management class
- `IJobQueue`: Interface for queue implementations

### Rate Limiters

- `ConcurrencyLimiter`: Limits concurrent job executions
- `DelayLimiter`: Enforces minimum delay between jobs
- `CompositeLimiter`: Combines multiple limiters
- `NullLimiter`: No-op limiter for development
- `InMemoryRateLimiter`: Rate limiter using in-memory storage
- `IndexedDbRateLimiter`: Rate limiter using IndexedDB storage
- `SqliteRateLimiter`: Rate limiter using SQLite storage
- `PostgresRateLimiter`: Rate limiter using PostgreSQL storage

### Storage Implementations

- `InMemoryJobQueue` - Volatile memory storage using `InMemoryQueueStorage`
- `IndexedDbJobQueue` - Browser persistent storage using `IndexedDbQueueStorage`
- `SqliteJobQueue` - Local SQLite storage using `SqliteQueueStorage`
- `PostgresJobQueue` - PostgreSQL persistent storage using `PostgresQueueStorage`

## Testing

Run all tests:

```bash
bun test
```

## License

Apache 2.0 - See LICENSE for details
