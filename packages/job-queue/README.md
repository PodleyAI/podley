# @workglow/job-queue

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
- [Production Architecture](#production-architecture)
  - [Client-Server-Worker Pattern](#client-server-worker-pattern)
  - [JobQueueClient](#jobqueueclient)
  - [JobQueueWorker](#jobqueueworker)
  - [JobQueueServer](#jobqueueserver)
  - [Production Deployment Example](#production-deployment-example)
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
bun add @workglow/job-queue
```

For specific storage backends, you may need additional dependencies:

```bash
# For SQLite support
bun add @workglow/sqlite

# For PostgreSQL support
bun add pg @types/pg

# For comprehensive storage options
bun add @workglow/storage
```

## Quick Start

```typescript
import { Job, JobQueue } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";

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
import { Job, IJobExecuteContext } from "@workglow/job-queue";

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
import { JobQueue, ConcurrencyLimiter } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";

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
import { RetryableJobError, PermanentJobError } from "@workglow/job-queue";

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
import { JobQueue } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";

const queue = new JobQueue("my-queue", MyJob, {
  storage: new InMemoryQueueStorage("my-queue"),
  // Jobs are lost when the process restarts
});
```

### IndexedDB Storage (Browser)

```typescript
import { JobQueue } from "@workglow/job-queue";
import { IndexedDbQueueStorage } from "@workglow/storage";

// For browser environments
const queue = new JobQueue("my-queue", MyJob, {
  storage: new IndexedDbQueueStorage("my-queue"),
  // Jobs persist in browser storage
});
```

### SQLite Storage (Node.js/Bun)

```typescript
import { JobQueue } from "@workglow/job-queue";
import { SqliteQueueStorage } from "@workglow/storage";

const queue = new JobQueue("my-queue", MyJob, {
  storage: new SqliteQueueStorage("./jobs.db", "my-queue"),
  // Jobs persist in SQLite file
});
```

### PostgreSQL Storage (Node.js/Bun)

```typescript
import { JobQueue } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
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
import { ConcurrencyLimiter } from "@workglow/job-queue";

// Limit to 5 concurrent jobs with 1 second minimum between starts
const limiter = new ConcurrencyLimiter(5, 1000);

const queue = new JobQueue("my-queue", MyJob, {
  storage: new InMemoryQueueStorage("my-queue"),
  limiter,
});
```

### Delay Limiter

```typescript
import { DelayLimiter } from "@workglow/job-queue";

// Minimum 500ms delay between job starts
const limiter = new DelayLimiter(500);
```

### Rate Limiter

```typescript
import { InMemoryRateLimiter } from "@workglow/job-queue";

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
import { CompositeLimiter, ConcurrencyLimiter, DelayLimiter } from "@workglow/job-queue";

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
import { QueueMode } from "@workglow/job-queue";

// Client mode - can add jobs and get progress, but doesn't process them
await queue.start(QueueMode.CLIENT);

// Server mode - processes jobs but can't add new ones
await queue.start(QueueMode.SERVER);

// Both modes - can add and process jobs (default)
await queue.start(QueueMode.BOTH);
```

## Production Architecture

For production deployments, `@workglow/job-queue` provides separate **Client**, **Worker**, and **Server** classes that enable scalable, distributed job processing architectures. This separation of concerns allows you to:

- Scale workers independently from clients
- Deploy workers across multiple machines
- Centralize job coordination in a server
- Use persistent storage backends (PostgreSQL, SQLite) for durability

### Client-Server-Worker Pattern

The production architecture consists of three distinct components:

1. **JobQueueClient** - Submits jobs and monitors progress
2. **JobQueueWorker** - Executes jobs from the queue
3. **JobQueueServer** - Coordinates multiple workers and manages the queue

All three components share the same storage backend, enabling distributed operation.

### JobQueueClient

The client is responsible for submitting jobs and monitoring their progress. It does not process jobs itself.

```typescript
import { JobQueueClient } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
import { Pool } from "pg";

// Create shared storage
const pool = new Pool({
  host: "postgres.example.com",
  database: "jobs",
  user: "app",
  password: process.env.DB_PASSWORD,
});

const storage = new PostgresQueueStorage(pool, "image-processing");

// Create client
const client = new JobQueueClient("image-processing", ImageProcessingJob, storage, {
  waitDurationInMilliseconds: 1000, // Poll for updates every second
});

await client.start();

// Submit a job
const job = new ImageProcessingJob({
  input: { imageUrl: "https://example.com/image.jpg", format: "webp" },
});

const jobId = await client.add(job);

// Monitor progress
client.onJobProgress(jobId, (progress, message) => {
  console.log(`Job ${jobId}: ${progress}% - ${message}`);
});

// Wait for completion
const result = await client.waitFor(jobId);
console.log("Processing complete:", result);
```

### JobQueueWorker

The worker is responsible for executing jobs. Multiple workers can run in parallel.

```typescript
import { JobQueueWorker } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
import { ConcurrencyLimiter } from "@workglow/job-queue";
import { Pool } from "pg";

// Create shared storage (same configuration as client)
const pool = new Pool({
  host: "postgres.example.com",
  database: "jobs",
  user: "worker",
  password: process.env.DB_PASSWORD,
});

const storage = new PostgresQueueStorage(pool, "image-processing");

// Create worker with concurrency limiting
const worker = new JobQueueWorker("image-processing", ImageProcessingJob, storage, {
  limiter: new ConcurrencyLimiter(5), // Process up to 5 jobs concurrently
  waitDurationInMilliseconds: 100,
  deleteAfterCompletionMs: 3600000, // Keep completed jobs for 1 hour
  deleteAfterFailureMs: 86400000, // Keep failed jobs for 24 hours
});

// Listen to worker events
worker.on("job_start", (queueName, jobId) => {
  console.log(`Worker started job ${jobId}`);
});

worker.on("job_complete", (queueName, jobId, output) => {
  console.log(`Worker completed job ${jobId}:`, output);
});

worker.on("job_error", (queueName, jobId, error) => {
  console.error(`Worker failed job ${jobId}:`, error);
});

// Start processing jobs
await worker.start();

// Worker runs indefinitely until stopped
// To gracefully shutdown:
// await worker.stop();
```

### JobQueueServer

The server coordinates multiple workers and provides centralized monitoring and control.

```typescript
import { JobQueueServer } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
import { ConcurrencyLimiter } from "@workglow/job-queue";
import { Pool } from "pg";

// Create shared storage
const pool = new Pool({
  host: "postgres.example.com",
  database: "jobs",
  user: "server",
  password: process.env.DB_PASSWORD,
});

const storage = new PostgresQueueStorage(pool, "image-processing");

// Create server with 10 workers
const server = new JobQueueServer("image-processing", ImageProcessingJob, storage, {
  workerCount: 10, // Run 10 workers in this server instance
  limiter: new ConcurrencyLimiter(50), // Max 50 concurrent jobs across all workers
  waitDurationInMilliseconds: 100,
  deleteAfterCompletionMs: 3600000,
  deleteAfterFailureMs: 86400000,
});

// Monitor server-level events
server.on("job_complete", (queueName, jobId, output) => {
  console.log(`Job ${jobId} completed`);
});

server.on("queue_stats_update", (queueName, stats) => {
  console.log("Queue stats:", {
    completed: stats.completedJobs,
    failed: stats.failedJobs,
    avgProcessingTime: stats.averageProcessingTime,
  });
});

// Start the server
await server.start();

console.log(`Server started with ${server.getWorkerCount()} workers`);

// Get aggregated stats from all workers
const stats = server.getStats();
console.log("Total completed jobs:", stats.completedJobs);
```

### Production Deployment Example

Here's a complete example showing how to deploy in a production environment:

**1. Client Service (Web Application)**

```typescript
// client-service.ts
import { JobQueueClient } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const storage = new PostgresQueueStorage(pool, "tasks");

const client = new JobQueueClient("tasks", TaskJob, storage);
await client.start();

// Express route for submitting jobs
app.post("/api/tasks", async (req, res) => {
  const job = new TaskJob({ input: req.body });
  const jobId = await client.add(job);
  res.json({ jobId });
});

// WebSocket for real-time progress
io.on("connection", (socket) => {
  socket.on("watch-job", (jobId) => {
    const cleanup = client.onJobProgress(jobId, (progress, message) => {
      socket.emit("job-progress", { jobId, progress, message });
    });
    socket.on("disconnect", cleanup);
  });
});
```

**2. Worker Service (Separate Process/Container)**

```typescript
// worker-service.ts
import { JobQueueWorker } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
import { ConcurrencyLimiter } from "@workglow/job-queue";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const storage = new PostgresQueueStorage(pool, "tasks");

const worker = new JobQueueWorker("tasks", TaskJob, storage, {
  limiter: new ConcurrencyLimiter(parseInt(process.env.CONCURRENCY || "5")),
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.stop();
  await pool.end();
  process.exit(0);
});

await worker.start();
console.log("Worker started");
```

**3. Server Coordinator (Optional - for multi-worker management)**

```typescript
// server-coordinator.ts
import { JobQueueServer } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const storage = new PostgresQueueStorage(pool, "tasks");

const server = new JobQueueServer("tasks", TaskJob, storage, {
  workerCount: parseInt(process.env.WORKER_COUNT || "10"),
});

await server.start();

// Expose metrics endpoint
app.get("/metrics", (req, res) => {
  const stats = server.getStats();
  res.json(stats);
});
```

**Deployment Architecture:**

```
┌─────────────┐
│   Clients   │──┐
│ (Web Apps)  │  │
└─────────────┘  │
                 │
┌─────────────┐  │      ┌──────────────┐
│   Clients   │──┼─────▶│  PostgreSQL  │
│   (APIs)    │  │      │   (Shared    │
└─────────────┘  │      │   Storage)   │
                 │      └──────────────┘
┌─────────────┐  │              ▲
│   Server    │──┘              │
│ Coordinator │                 │
└─────────────┘                 │
                                │
┌─────────────┐                 │
│  Worker 1   │─────────────────┤
└─────────────┘                 │
                                │
┌─────────────┐                 │
│  Worker 2   │─────────────────┤
└─────────────┘                 │
                                │
┌─────────────┐                 │
│  Worker N   │─────────────────┘
└─────────────┘
```

**Key Benefits:**

- **Scalability**: Add more workers as needed
- **Resilience**: Workers can be restarted without losing jobs
- **Separation of Concerns**: Clients, workers, and coordinators have distinct responsibilities
- **Flexibility**: Deploy components independently
- **Monitoring**: Centralized stats and event tracking

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
import { JobQueue } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";

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
