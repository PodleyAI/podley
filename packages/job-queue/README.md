# @podley/job-queue

A robust, cross-platform job queue system for managing and processing asynchronous tasks with built-in rate limiting, retry logic, and multiple storage backends.

## Features

- **Multiple storage backends**: In-Memory, IndexedDB (browser), SQLite, PostgreSQL
- **Advanced rate limiting**: Concurrency limits, delays, composite strategies, and rate limiting with backoff
- **Job management**: Prioritization, retry logic, progress tracking, and event listeners
- **Cross-platform**: Works in Browser, Node.js, and Bun environments
- **TypeScript-first**: Full type safety and IntelliSense support
- **Event-driven**: Comprehensive event system for monitoring job lifecycle

## Installation

```bash
bun add @podley/job-queue @podley/storage
```

## Quick Start

```typescript
import { Job, JobQueue, ConcurrencyLimiter } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

// 1. Define your job input/output types
interface ProcessingInput {
  text: string;
  options?: { uppercase?: boolean };
}

interface ProcessingOutput {
  result: string;
  processedAt: Date;
}

// 2. Create a custom job class
class TextProcessingJob extends Job<ProcessingInput, ProcessingOutput> {
  async execute(input: ProcessingInput, context: IJobExecuteContext): Promise<ProcessingOutput> {
    // Simulate work with progress updates
    await context.updateProgress(25, "Starting processing...");
    
    // Check for cancellation
    if (context.signal.aborted) {
      throw new AbortSignalJobError("Job was cancelled");
    }
    
    await context.updateProgress(75, "Almost done...");
    
    const result = input.options?.uppercase 
      ? input.text.toUpperCase() 
      : input.text.toLowerCase();
    
    await context.updateProgress(100, "Completed");
    
    return {
      result,
      processedAt: new Date()
    };
  }
}

// 3. Create and configure the job queue
const queue = new JobQueue("text-processing", TextProcessingJob, {
  storage: new InMemoryQueueStorage("text-processing"),
  limiter: new ConcurrencyLimiter(3), // Max 3 concurrent jobs
  waitDurationInMilliseconds: 100,
  deleteAfterCompletionMs: 60_000, // Clean up after 1 minute
  deleteAfterFailureMs: 300_000,   // Keep failed jobs for 5 minutes
});

// 4. Start the queue
await queue.start();

// 5. Add jobs and process them
const job = new TextProcessingJob({
  input: { text: "Hello World", options: { uppercase: true } },
  maxRetries: 3
});

const jobId = await queue.add(job);
const output = await queue.waitFor(jobId);
console.log(output); // { result: "HELLO WORLD", processedAt: Date }
```

## Core Concepts

### Jobs

Jobs are the fundamental unit of work. They must extend the `Job` class and implement the `execute` method.

```typescript
import { Job, IJobExecuteContext, JobError, RetryableJobError } from "@podley/job-queue";

class MyJob extends Job<InputType, OutputType> {
  async execute(input: InputType, context: IJobExecuteContext): Promise<OutputType> {
    try {
      // Your job logic here
      await context.updateProgress(50, "Halfway done");
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { result: "success" };
    } catch (error) {
      if (error.isRetryable) {
        // Job will be retried after a delay
        throw new RetryableJobError("Temporary failure", new Date(Date.now() + 5000));
      }
      // Job will fail permanently
      throw new JobError("Permanent failure");
    }
  }
}
```

### Job Properties and Configuration

```typescript
const job = new MyJob({
  input: { data: "example" },
  maxRetries: 5,                    // Retry up to 5 times
  deadlineAt: new Date(Date.now() + 30000), // Must complete within 30 seconds
  runAfter: new Date(Date.now() + 1000),    // Don't start for 1 second
  fingerprint: "unique-id"          // For deduplication
});
```

### Queue Lifecycle Management

```typescript
// Start processing jobs
await queue.start();

// Stop the queue (completes running jobs)
await queue.stop();

// Clear all jobs from the queue
await queue.clear();

// Restart the queue
await queue.restart();

// Get queue statistics
const stats = queue.getStats();
console.log(`Total: ${stats.totalJobs}, Completed: ${stats.completedJobs}`);
```

## Storage Backends

### In-Memory Storage (Any Platform)

```typescript
import { JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";

const queue = new JobQueue("my-queue", MyJob, {
  storage: new InMemoryQueueStorage("my-queue")
});
```

### IndexedDB Storage (Browser)

```typescript
import { JobQueue } from "@podley/job-queue";
import { IndexedDbQueueStorage } from "@podley/storage";

const queue = new JobQueue("browser-queue", MyJob, {
  storage: new IndexedDbQueueStorage("browser-queue")
});
```

### SQLite Storage (Node.js/Bun)

```typescript
import { JobQueue } from "@podley/job-queue";
import { SqliteQueueStorage } from "@podley/storage";
import { Database } from "bun:sqlite"; // or your SQLite driver

const db = new Database("jobs.db");
const queue = new JobQueue("sqlite-queue", MyJob, {
  storage: new SqliteQueueStorage(db, "sqlite-queue")
});
```

### PostgreSQL Storage (Node.js/Bun)

```typescript
import { JobQueue } from "@podley/job-queue";
import { PostgresQueueStorage } from "@podley/storage";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://user:password@localhost/db"
});

const queue = new JobQueue("postgres-queue", MyJob, {
  storage: new PostgresQueueStorage(pool, "postgres-queue")
});
```

## Rate Limiting

### Concurrency Limiter

Limits the number of jobs running simultaneously:

```typescript
import { ConcurrencyLimiter } from "@podley/job-queue";

const queue = new JobQueue("my-queue", MyJob, {
  limiter: new ConcurrencyLimiter(5) // Max 5 jobs at once
});
```

### Delay Limiter

Enforces minimum delay between job starts:

```typescript
import { DelayLimiter } from "@podley/job-queue";

const queue = new JobQueue("my-queue", MyJob, {
  limiter: new DelayLimiter(1000) // 1 second between jobs
});
```

### Rate Limiter with Backoff

Controls execution rate with exponential backoff:

```typescript
import { InMemoryRateLimiter } from "@podley/job-queue";

const queue = new JobQueue("my-queue", MyJob, {
  limiter: new InMemoryRateLimiter({
    maxExecutions: 10,        // Max 10 executions
    windowSizeInSeconds: 60,  // Per 60 seconds
    initialBackoffDelay: 1000,   // Start with 1s backoff
    backoffMultiplier: 2,        // Double backoff each time
    maxBackoffDelay: 300000      // Max 5 minutes backoff
  })
});
```

### Composite Limiter

Combine multiple limiting strategies:

```typescript
import { CompositeLimiter, ConcurrencyLimiter, DelayLimiter } from "@podley/job-queue";

const queue = new JobQueue("my-queue", MyJob, {
  limiter: new CompositeLimiter([
    new ConcurrencyLimiter(3),    // Max 3 concurrent
    new DelayLimiter(500)         // 500ms between starts
  ])
});
```

### Database-Backed Rate Limiters

For distributed systems, use database-backed rate limiters:

```typescript
import { SqliteRateLimiter, PostgresRateLimiter } from "@podley/job-queue";

// SQLite
const queue = new JobQueue("my-queue", MyJob, {
  limiter: new SqliteRateLimiter(db, "limiter-table", {
    maxExecutions: 10,
    windowSizeInSeconds: 60
  })
});

// PostgreSQL  
const queue = new JobQueue("my-queue", MyJob, {
  limiter: new PostgresRateLimiter(pool, "limiter-table", {
    maxExecutions: 10,
    windowSizeInSeconds: 60
  })
});
```

## Event Handling

The job queue emits events throughout the job lifecycle:

```typescript
// Queue lifecycle events
queue.on("queue_start", (queueName) => {
  console.log(`Queue ${queueName} started`);
});

queue.on("queue_stop", (queueName) => {
  console.log(`Queue ${queueName} stopped`);
});

// Job lifecycle events
queue.on("job_start", (queueName, jobId) => {
  console.log(`Job ${jobId} started`);
});

queue.on("job_complete", (queueName, jobId, output) => {
  console.log(`Job ${jobId} completed:`, output);
});

queue.on("job_error", (queueName, jobId, error) => {
  console.error(`Job ${jobId} failed:`, error);
});

queue.on("job_retry", (queueName, jobId, runAfter) => {
  console.log(`Job ${jobId} will retry at`, runAfter);
});

// Progress tracking
queue.on("job_progress", (queueName, jobId, progress, message, details) => {
  console.log(`Job ${jobId}: ${progress}% - ${message}`);
});

// Queue statistics
queue.on("queue_stats_update", (queueName, stats) => {
  console.log(`Queue stats:`, stats);
});
```

## Job Management

### Adding Jobs

```typescript
// Simple job
const jobId = await queue.add(new MyJob({ input: { data: "example" } }));

// Job with custom options
const jobId = await queue.add(new MyJob({
  input: { data: "example" },
  maxRetries: 3,
  deadlineAt: new Date(Date.now() + 30000),
  fingerprint: "unique-operation-id"
}));
```

### Waiting for Job Completion

```typescript
try {
  const output = await queue.waitFor(jobId);
  console.log("Job completed:", output);
} catch (error) {
  console.error("Job failed:", error);
}
```

### Monitoring Job Progress

```typescript
// Listen to progress for a specific job
const removeListener = queue.onJobProgress(jobId, (progress, message, details) => {
  console.log(`Progress: ${progress}% - ${message}`, details);
});

// Clean up listener when done
removeListener();
```

### Querying Jobs

```typescript
// Get a specific job
const job = await queue.get(jobId);

// Get queue size
const totalJobs = await queue.size();
const pendingJobs = await queue.size(JobStatus.PENDING);

// Peek at jobs without removing them
const pendingJobs = await queue.peek(JobStatus.PENDING, 10);

// Find output for specific input (caching)
const output = await queue.outputForInput({ data: "example" });
```

### Aborting Jobs

```typescript
await queue.abort(jobId);
```

## Error Handling

### Job Error Types

```typescript
import { 
  JobError, 
  RetryableJobError, 
  PermanentJobError, 
  AbortSignalJobError 
} from "@podley/job-queue";

class MyJob extends Job<InputType, OutputType> {
  async execute(input: InputType, context: IJobExecuteContext): Promise<OutputType> {
    // Check for cancellation
    if (context.signal.aborted) {
      throw new AbortSignalJobError("Job was cancelled");
    }

    try {
      // Your job logic
      return await this.doWork(input);
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        // Retry after 30 seconds
        const retryDate = new Date(Date.now() + 30000);
        throw new RetryableJobError("Rate limited", retryDate);
      }
      
      if (error.code === 'INVALID_INPUT') {
        // Don't retry
        throw new PermanentJobError("Invalid input provided");
      }
      
      // Default retryable error
      throw new JobError("Unexpected error occurred");
    }
  }
}
```

### Queue Error Handling

```typescript
queue.on("job_error", (queueName, jobId, error) => {
  console.error(`Job ${jobId} in queue ${queueName} failed:`, error);
  
  // Implement custom error handling logic
  if (error.includes("CRITICAL")) {
    // Alert operations team
    notifyOpsTeam(jobId, error);
  }
});
```

## Advanced Usage

### Job Fingerprinting (Deduplication)

```typescript
// Jobs with the same fingerprint will be deduplicated
const job1 = new MyJob({
  input: { url: "https://example.com" },
  fingerprint: "download-https://example.com"
});

const job2 = new MyJob({
  input: { url: "https://example.com" },
  fingerprint: "download-https://example.com" // Same fingerprint
});

await queue.add(job1);
await queue.add(job2); // Will reuse job1's result
```

### Scheduled Jobs

```typescript
// Run job 1 hour from now
const job = new MyJob({
  input: { data: "scheduled" },
  runAfter: new Date(Date.now() + 3600000)
});

await queue.add(job);
```

### Job Deadlines

```typescript
// Job must complete within 30 seconds
const job = new MyJob({
  input: { data: "urgent" },
  deadlineAt: new Date(Date.now() + 30000)
});

await queue.add(job);
```

### Custom Progress Tracking

```typescript
class FileProcessingJob extends Job<{ filePath: string }, { processedBytes: number }> {
  async execute(input: { filePath: string }, context: IJobExecuteContext) {
    const fileSize = await getFileSize(input.filePath);
    let processedBytes = 0;
    
    const stream = createReadStream(input.filePath);
    
    for await (const chunk of stream) {
      // Check for cancellation
      if (context.signal.aborted) {
        throw new AbortSignalJobError("Processing cancelled");
      }
      
      // Process chunk
      await processChunk(chunk);
      processedBytes += chunk.length;
      
      // Update progress
      const progress = Math.round((processedBytes / fileSize) * 100);
      await context.updateProgress(progress, `Processed ${processedBytes}/${fileSize} bytes`, {
        processedBytes,
        totalBytes: fileSize,
        currentChunk: chunk.length
      });
    }
    
    return { processedBytes };
  }
}
```

## API Reference

### Core Classes

#### `Job<Input, Output>`
Base class for all jobs.

**Constructor Parameters:**
- `input: Input` - The job's input data
- `maxRetries?: number` - Maximum retry attempts (default: 10)
- `deadlineAt?: Date` - Job must complete by this time
- `runAfter?: Date` - Don't start job before this time
- `fingerprint?: string` - Unique identifier for deduplication

**Methods:**
- `execute(input: Input, context: IJobExecuteContext): Promise<Output>` - Override this method
- `updateProgress(progress: number, message?: string, details?: object): Promise<void>`
- `onJobProgress(listener: JobProgressListener): () => void`

#### `JobQueue<Input, Output, QueueJob>`
Main queue management class.

**Constructor Parameters:**
- `queueName: string` - Unique queue identifier
- `jobClass: JobClass<Input, Output>` - Job class constructor
- `options: JobQueueOptions<Input, Output>` - Configuration options

**Methods:**
- `start(mode?: QueueMode): Promise<this>` - Start the queue
- `stop(): Promise<this>` - Stop the queue
- `add(job: QueueJob): Promise<unknown>` - Add a job
- `get(id: unknown): Promise<Job<Input, Output> | undefined>` - Get job by ID
- `waitFor(jobId: unknown): Promise<Output | undefined>` - Wait for completion
- `abort(jobId: unknown): Promise<void>` - Cancel a job
- `peek(status?: JobStatus, num?: number): Promise<Job<Input, Output>[]>` - View jobs
- `size(status?: JobStatus): Promise<number>` - Get queue size
- `clear(): Promise<this>` - Remove all jobs
- `getStats(): JobQueueStats` - Get queue statistics

### Rate Limiters

#### `ConcurrencyLimiter(maxConcurrent: number)`
Limits concurrent job execution.

#### `DelayLimiter(delayMs: number)`
Enforces minimum delay between job starts.

#### `InMemoryRateLimiter(options: RateLimiterOptions)`
Rate limiting with backoff using in-memory storage.

#### `SqliteRateLimiter(db: Database, tableName: string, options: RateLimiterOptions)`
Rate limiting with SQLite persistence.

#### `PostgresRateLimiter(pool: Pool, tableName: string, options: RateLimiterOptions)`
Rate limiting with PostgreSQL persistence.

#### `CompositeLimiter(limiters: ILimiter[])`
Combines multiple limiters.

### Event Types

- `queue_start` - Queue started
- `queue_stop` - Queue stopped  
- `job_start` - Job execution started
- `job_complete` - Job completed successfully
- `job_error` - Job failed
- `job_retry` - Job scheduled for retry
- `job_aborting` - Job being cancelled
- `job_skipped` - Job was skipped
- `job_progress` - Job progress updated
- `queue_stats_update` - Queue statistics updated

### Job Status Enum

```typescript
enum JobStatus {
  PENDING = "pending",
  RUNNING = "running", 
  COMPLETED = "completed",
  FAILED = "failed",
  ABORTED = "aborted",
  RETRYING = "retrying"
}
```

## Testing

Run the test suite:

```bash
bun test
```

The package includes comprehensive tests for all storage backends and rate limiters.

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
