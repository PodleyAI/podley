# @podley/job-queue

A TypeScript-first job queue system for managing and processing asynchronous tasks with rate limiting, progress tracking, and cross-platform persistence.

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Jobs](#jobs)
  - [Job Queues](#job-queues)
  - [Storage Backends](#storage-backends)
  - [Rate Limiters](#rate-limiters)
- [Usage Examples](#usage-examples)
  - [Creating Custom Jobs](#creating-custom-jobs)
  - [Basic Queue Operations](#basic-queue-operations)
  - [Progress Tracking](#progress-tracking)
  - [Error Handling and Retries](#error-handling-and-retries)
  - [Event Listeners](#event-listeners)
  - [Job Completion and Output](#job-completion-and-output)
- [Storage Configurations](#storage-configurations)
  - [In-Memory Storage](#in-memory-storage)
  - [IndexedDB Storage (Browser)](#indexeddb-storage-browser)
  - [SQLite Storage (Node.js/Bun)](#sqlite-storage-nodejsbun)
  - [PostgreSQL Storage (Node.js/Bun)](#postgresql-storage-nodejsbun)
- [Rate Limiting Strategies](#rate-limiting-strategies)
  - [Concurrency Limiter](#concurrency-limiter)
  - [Delay Limiter](#delay-limiter)
  - [Rate Limiter](#rate-limiter)
  - [Composite Limiter](#composite-limiter)
- [Queue Modes](#queue-modes)
- [API Reference](#api-reference)
  - [JobQueue Methods](#jobqueue-methods)
  - [Job Class](#job-class)
- [TypeScript Types](#typescript-types)
- [Testing](#testing)
- [License](#license)

## Features

- **Cross-platform**: Works in browsers (IndexedDB), Node.js, and Bun
- **Multiple storage backends**: In-Memory, IndexedDB, SQLite, PostgreSQL
- **Rate limiting**: Concurrency, delay, and composite rate limiting strategies
- **Progress tracking**: Real-time job progress with events and callbacks
- **Retry logic**: Configurable retry attempts with exponential backoff
- **Event system**: Comprehensive event listeners for job lifecycle
- **TypeScript-first**: Full type safety with generic input/output types
- **Job prioritization**: Support for job scheduling and deadlines
- **Queue modes**: Client-only, server-only, or both modes of operation

## Installation

```bash
bun add @podley/job-queue
```

For specific storage backends, you may need additional dependencies:

```bash
# For SQLite support
bun add @podley/sqlite

# For PostgreSQL support
bun add pg @types/pg

# For comprehensive storage options
bun add @podley/storage
```

## Quick Start

```typescript
import { Job, JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

// 1. Define your input/output types
interface ProcessTextInput {
  text: string;
  options?: { uppercase?: boolean };
}

interface ProcessTextOutput {
  processedText: string;
  wordCount: number;
}

// 2. Create a custom job class
class ProcessTextJob extends Job<ProcessTextInput, ProcessTextOutput> {
  async execute(input: ProcessTextInput, context: IJobExecuteContext): Promise<ProcessTextOutput> {
    const { text, options = {} } = input;

    // Simulate work with progress updates
    await context.updateProgress(25, "Starting text processing");

    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate work
    await context.updateProgress(50, "Processing text");

    const processedText = options.uppercase ? text.toUpperCase() : text.toLowerCase();
    await context.updateProgress(75, "Counting words");

    const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
    await context.updateProgress(100, "Complete");

    return { processedText, wordCount };
  }
}

// 3. Create and start the queue
const queue = new JobQueue("text-processor", ProcessTextJob, {
  storage: new InMemoryQueueStorage("text-processor"),
  deleteAfterCompletionMs: 60_000, // Clean up after 1 minute
  deleteAfterFailureMs: 300_000, // Keep failed jobs for 5 minutes
});

await queue.start();

// 4. Add jobs and wait for results
const job = new ProcessTextJob({
  input: { text: "Hello World", options: { uppercase: true } },
  maxRetries: 3,
});

const jobId = await queue.add(job);
const result = await queue.waitFor(jobId);
console.log(result); // { processedText: "HELLO WORLD", wordCount: 2 }

await queue.stop();
```

## Core Concepts

### Jobs

Jobs are units of work that can be executed by a queue. Each job has:

- **Input**: Data needed for execution (strongly typed)
- **Output**: Result of execution (strongly typed)
- **Status**: PENDING, RUNNING, COMPLETED, FAILED, ABORTING, DISABLED
- **Progress**: 0-100 with optional message and details
- **Retry logic**: Configurable max retries and retry strategies

### Job Queues

Queues manage job execution with:

- **Storage backend**: Where jobs are persisted
- **Rate limiting**: Controls job execution rate
- **Event system**: Lifecycle notifications
- **Queue modes**: CLIENT (submit only), SERVER (process only), BOTH

### Storage Backends

Storage determines where jobs are persisted:

- **InMemoryQueueStorage**: Volatile, lost on restart
- **IndexedDbQueueStorage**: Browser persistent storage
- **SqliteQueueStorage**: Local SQLite file
- **PostgresQueueStorage**: PostgreSQL database

### Rate Limiters

Control job execution rate:

- **ConcurrencyLimiter**: Max concurrent jobs
- **DelayLimiter**: Minimum delay between jobs
- **InMemoryRateLimiter**: Requests per time window
- **CompositeLimiter**: Combine multiple limiters

## Usage Examples

### Creating Custom Jobs

```typescript
import { Job, IJobExecuteContext } from "@podley/job-queue";

interface DownloadInput {
  url: string;
  filename: string;
}

interface DownloadOutput {
  filepath: string;
  size: number;
}

class DownloadJob extends Job<DownloadInput, DownloadOutput> {
  async execute(input: DownloadInput, context: IJobExecuteContext): Promise<DownloadOutput> {
    const { url, filename } = input;

    // Check for abort signal
    if (context.signal.aborted) {
      throw new Error("Job was aborted");
    }

    // Update progress
    await context.updateProgress(10, "Starting download");

    // Simulate download with progress
    for (let i = 20; i <= 90; i += 10) {
      if (context.signal.aborted) throw new Error("Job was aborted");

      await new Promise((resolve) => setTimeout(resolve, 100));
      await context.updateProgress(i, `Downloaded ${i}%`);
    }

    await context.updateProgress(100, "Download complete");

    return {
      filepath: `/downloads/${filename}`,
      size: 1024 * 1024, // 1MB
    };
  }
}
```

### Basic Queue Operations

```typescript
import { JobQueue, ConcurrencyLimiter } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

// Create queue with concurrency limiting
const queue = new JobQueue("downloads", DownloadJob, {
  storage: new InMemoryQueueStorage("downloads"),
  limiter: new ConcurrencyLimiter(3), // Max 3 concurrent downloads
  waitDurationInMilliseconds: 500, // Check for new jobs every 500ms
});

// Start the queue
await queue.start();

// Add multiple jobs
const jobIds = await Promise.all([
  queue.add(
    new DownloadJob({
      input: { url: "https://example.com/file1.zip", filename: "file1.zip" },
    })
  ),
  queue.add(
    new DownloadJob({
      input: { url: "https://example.com/file2.zip", filename: "file2.zip" },
    })
  ),
]);

// Check queue status
const queueSize = await queue.size(); // Total jobs
const pendingJobs = await queue.size(JobStatus.PENDING);
const runningJobs = await queue.size(JobStatus.RUNNING);

// Peek at jobs
const nextJobs = await queue.peek(JobStatus.PENDING, 5);

// Get queue statistics
const stats = queue.getStats();
console.log(`Completed: ${stats.completedJobs}, Failed: ${stats.failedJobs}`);
```

### Progress Tracking

```typescript
// Listen to progress for a specific job
const removeListener = queue.onJobProgress(jobId, (progress, message, details) => {
  console.log(`Job ${jobId}: ${progress}% - ${message}`);
  if (details) {
    console.log("Details:", details);
  }
});

// You can also listen on the job itself
const job = new DownloadJob({ input: { url: "...", filename: "..." } });
job.onJobProgress((progress, message, details) => {
  console.log(`Progress: ${progress}% - ${message}`);
});

const jobId = await queue.add(job);

// Wait for completion
try {
  const result = await queue.waitFor(jobId);
  console.log("Download completed:", result);
} finally {
  removeListener(); // Clean up listener
}
```

### Error Handling and Retries

```typescript
import { RetryableJobError, PermanentJobError } from "@podley/job-queue";

class ApiCallJob extends Job<{ endpoint: string }, { data: any }> {
  async execute(input: { endpoint: string }, context: IJobExecuteContext) {
    try {
      const response = await fetch(input.endpoint);

      if (response.status === 429) {
        // Rate limited - retry with delay
        throw new RetryableJobError(
          "Rate limited",
          new Date(Date.now() + 60000) // Retry in 1 minute
        );
      }

      if (response.status === 404) {
        // Not found - don't retry
        throw new PermanentJobError("Endpoint not found");
      }

      if (!response.ok) {
        // Server error - allow retries
        throw new RetryableJobError(`HTTP ${response.status}`);
      }

      return { data: await response.json() };
    } catch (error) {
      if (error instanceof RetryableJobError || error instanceof PermanentJobError) {
        throw error;
      }
      // Network errors etc. - allow retries
      throw new RetryableJobError(error.message);
    }
  }
}

// Create job with retry configuration
const apiJob = new ApiCallJob({
  input: { endpoint: "https://api.example.com/data" },
  maxRetries: 5, // Try up to 5 times
});
```

### Event Listeners

```typescript
// Listen to all queue events
queue.on("queue_start", (queueName) => {
  console.log(`Queue ${queueName} started`);
});

queue.on("job_start", (queueName, jobId) => {
  console.log(`Job ${jobId} started in queue ${queueName}`);
});

queue.on("job_complete", (queueName, jobId, output) => {
  console.log(`Job ${jobId} completed with output:`, output);
});

queue.on("job_error", (queueName, jobId, error) => {
  console.error(`Job ${jobId} failed with error: ${error}`);
});

queue.on("job_retry", (queueName, jobId, runAfter) => {
  console.log(`Job ${jobId} will retry at ${runAfter}`);
});

queue.on("job_progress", (queueName, jobId, progress, message, details) => {
  console.log(`Job ${jobId}: ${progress}% - ${message}`);
});

queue.on("queue_stats_update", (queueName, stats) => {
  console.log(`Queue stats:`, stats);
});

// Wait for specific events
const [queueName] = await queue.waitOn("queue_start");
const [queueName, jobId, output] = await queue.waitOn("job_complete");
```

### Job Completion and Output

```typescript
// Wait for job completion
const jobId = await queue.add(job);

try {
  // This will resolve with the job output or reject with an error
  const output = await queue.waitFor(jobId);
  console.log("Job completed successfully:", output);
} catch (error) {
  console.error("Job failed:", error);
}

// Check if output already exists for given input (caching)
const existingOutput = await queue.outputForInput({
  url: "https://example.com/file.zip",
  filename: "file.zip",
});

if (existingOutput) {
  console.log("Already processed:", existingOutput);
} else {
  // Add new job
  const newJobId = await queue.add(
    new DownloadJob({
      input: { url: "https://example.com/file.zip", filename: "file.zip" },
    })
  );
}

// Abort a running job
await queue.abort(jobId);

// Get job details
const job = await queue.get(jobId);
if (job) {
  console.log(`Job status: ${job.status}, progress: ${job.progress}%`);
}
```

## Storage Configurations

### In-Memory Storage

```typescript
import { JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

const queue = new JobQueue("my-queue", MyJob, {
  storage: new InMemoryQueueStorage("my-queue"),
  // Jobs are lost when the process restarts
});
```

### IndexedDB Storage (Browser)

```typescript
import { JobQueue } from "@podley/job-queue";
import { IndexedDbQueueStorage } from "@podley/storage";

// For browser environments
const queue = new JobQueue("my-queue", MyJob, {
  storage: new IndexedDbQueueStorage("my-queue"),
  // Jobs persist in browser storage
});
```

### SQLite Storage (Node.js/Bun)

```typescript
import { JobQueue } from "@podley/job-queue";
import { SqliteQueueStorage } from "@podley/storage";

const queue = new JobQueue("my-queue", MyJob, {
  storage: new SqliteQueueStorage("./jobs.db", "my-queue"),
  // Jobs persist in SQLite file
});
```

### PostgreSQL Storage (Node.js/Bun)

```typescript
import { JobQueue } from "@podley/job-queue";
import { PostgresQueueStorage } from "@podley/storage";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "jobs",
  user: "postgres",
  password: "password",
});

const queue = new JobQueue("my-queue", MyJob, {
  storage: new PostgresQueueStorage(pool, "my-queue"),
  // Jobs persist in PostgreSQL
});
```

## Rate Limiting Strategies

### Concurrency Limiter

```typescript
import { ConcurrencyLimiter } from "@podley/job-queue";

// Limit to 5 concurrent jobs with 1 second minimum between starts
const limiter = new ConcurrencyLimiter(5, 1000);

const queue = new JobQueue("my-queue", MyJob, {
  storage: new InMemoryQueueStorage("my-queue"),
  limiter,
});
```

### Delay Limiter

```typescript
import { DelayLimiter } from "@podley/job-queue";

// Minimum 500ms delay between job starts
const limiter = new DelayLimiter(500);
```

### Rate Limiter

```typescript
import { InMemoryRateLimiter } from "@podley/job-queue";

// Max 10 executions per 60-second window
const limiter = new InMemoryRateLimiter({
  maxExecutions: 10,
  windowSizeInSeconds: 60,
  initialBackoffDelay: 1000, // Start with 1s backoff
  backoffMultiplier: 2, // Double delay each time
  maxBackoffDelay: 60000, // Max 60s backoff
});
```

### Composite Limiter

```typescript
import { CompositeLimiter, ConcurrencyLimiter, DelayLimiter } from "@podley/job-queue";

// Combine multiple limiting strategies
const limiter = new CompositeLimiter([
  new ConcurrencyLimiter(3), // Max 3 concurrent
  new DelayLimiter(100), // 100ms between starts
  new InMemoryRateLimiter({
    // Max 20 per minute
    maxExecutions: 20,
    windowSizeInSeconds: 60,
  }),
]);
```

## Queue Modes

```typescript
import { QueueMode } from "@podley/job-queue";

// Client mode - can add jobs and get progress, but doesn't process them
await queue.start(QueueMode.CLIENT);

// Server mode - processes jobs but can't add new ones
await queue.start(QueueMode.SERVER);

// Both modes - can add and process jobs (default)
await queue.start(QueueMode.BOTH);
```

## API Reference

### JobQueue Methods

```typescript
interface IJobQueue<Input, Output> {
  // Queue management
  start(mode?: QueueMode): Promise<this>;
  stop(): Promise<this>;
  clear(): Promise<this>;
  restart(): Promise<this>;

  // Job operations
  add(job: Job<Input, Output>): Promise<unknown>;
  get(id: unknown): Promise<Job<Input, Output> | undefined>;
  waitFor(jobId: unknown): Promise<Output | undefined>;
  abort(jobId: unknown): Promise<void>;

  // Queue inspection
  peek(status?: JobStatus, num?: number): Promise<Job<Input, Output>[]>;
  size(status?: JobStatus): Promise<number>;
  getStats(): JobQueueStats;

  // Utility
  outputForInput(input: Input): Promise<Output | null>;
  getJobsByRunId(jobRunId: string): Promise<Job<Input, Output>[]>;

  // Progress tracking
  updateProgress(
    jobId: unknown,
    progress: number,
    message?: string,
    details?: Record<string, any>
  ): Promise<void>;
  onJobProgress(jobId: unknown, listener: JobProgressListener): () => void;
}
```

### Job Class

```typescript
class Job<Input, Output> {
  // Properties
  id: unknown;
  input: Input;
  output: Output | null;
  status: JobStatus;
  progress: number;
  progressMessage: string;
  progressDetails: Record<string, any> | null;
  maxRetries: number;
  runAttempts: number;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;

  // Methods
  abstract execute(input: Input, context: IJobExecuteContext): Promise<Output>;
  updateProgress(progress: number, message?: string, details?: Record<string, any>): Promise<void>;
  onJobProgress(listener: JobProgressListener): () => void;
}
```

## TypeScript Types

```typescript
// Job statuses
enum JobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  ABORTING = "ABORTING",
  DISABLED = "DISABLED",
}

// Queue options
interface JobQueueOptions<Input, Output> {
  deleteAfterCompletionMs?: number;
  deleteAfterFailureMs?: number;
  deleteAfterDisabledMs?: number;
  waitDurationInMilliseconds?: number;
  limiter?: ILimiter;
  storage?: IQueueStorage<Input, Output>;
}

// Job execution context
interface IJobExecuteContext {
  signal: AbortSignal;
  updateProgress: (
    progress: number,
    message?: string,
    details?: Record<string, any>
  ) => Promise<void>;
}

// Progress listener
type JobProgressListener = (
  progress: number,
  message: string,
  details: Record<string, any> | null
) => void;

// Queue statistics
interface JobQueueStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  abortedJobs: number;
  retriedJobs: number;
  disabledJobs: number;
  averageProcessingTime?: number;
  lastUpdateTime: Date;
}
```

## Testing

Run tests:

```bash
bun test
```

Example test:

```typescript
import { describe, it, expect } from "vitest";
import { JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

describe("JobQueue", () => {
  it("should process jobs successfully", async () => {
    const queue = new JobQueue("test", TestJob, {
      storage: new InMemoryQueueStorage("test"),
    });

    await queue.start();

    const job = new TestJob({ input: { data: "test" } });
    const jobId = await queue.add(job);
    const result = await queue.waitFor(jobId);

    expect(result).toEqual({ processed: "test" });

    await queue.stop();
  });
});
```

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details
