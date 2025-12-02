# Migration Guide: Production Architecture

This guide helps you migrate from the simple `JobQueue` class to the production-grade client-server-worker architecture.

## Overview

The job queue system now provides three specialized classes for production deployments:

- **`JobQueueClient`** - For submitting jobs and monitoring progress (replaces `JobQueue` in client mode)
- **`JobQueueWorker`** - For executing jobs (replaces `JobQueue` in server mode)
- **`JobQueueServer`** - For coordinating multiple workers (new)

The original `JobQueue` class remains available for backward compatibility and simple use cases.

## When to Migrate

### Stick with `JobQueue` if:
- You're building a simple application
- Client and server run in the same process
- You don't need to scale workers independently
- In-memory storage is sufficient

### Migrate to Client-Server-Worker if:
- You need to scale workers across multiple machines
- Client and server are separate services
- You want better separation of concerns
- You're using persistent storage (PostgreSQL, SQLite)

## Migration Steps

### Before (Simple JobQueue)

```typescript
import { JobQueue } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";

const queue = new JobQueue("tasks", TaskJob, {
  storage: new InMemoryQueueStorage("tasks"),
});

await queue.start(); // Starts in BOTH mode by default

// Submit and process jobs
const jobId = await queue.add(new TaskJob({ input: data }));
const result = await queue.waitFor(jobId);
```

### After (Client-Server-Worker)

#### Client Service

```typescript
import { JobQueueClient } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";

const storage = new PostgresQueueStorage(pool, "tasks");
const client = new JobQueueClient("tasks", TaskJob, storage);

await client.start();

// Submit jobs
const jobId = await client.add(new TaskJob({ input: data }));
const result = await client.waitFor(jobId);
```

#### Worker Service

```typescript
import { JobQueueWorker } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";

const storage = new PostgresQueueStorage(pool, "tasks");
const worker = new JobQueueWorker("tasks", TaskJob, storage, {
  limiter: new ConcurrencyLimiter(5),
});

await worker.start();
// Worker runs indefinitely
```

#### Server Coordinator (Optional)

```typescript
import { JobQueueServer } from "@workglow/job-queue";
import { PostgresQueueStorage } from "@workglow/storage";

const storage = new PostgresQueueStorage(pool, "tasks");
const server = new JobQueueServer("tasks", TaskJob, storage, {
  workerCount: 10, // Run 10 workers
});

await server.start();
```

## API Mapping

### JobQueue → JobQueueClient

| JobQueue (BOTH/CLIENT mode) | JobQueueClient |
|------------------------------|----------------|
| `queue.add(job)` | `client.add(job)` |
| `queue.get(id)` | `client.get(id)` |
| `queue.waitFor(id)` | `client.waitFor(id)` |
| `queue.abort(id)` | `client.abort(id)` |
| `queue.peek()` | `client.peek()` |
| `queue.size()` | `client.size()` |
| `queue.onJobProgress()` | `client.onJobProgress()` |
| `queue.on(event, listener)` | `client.on(event, listener)` |
| `queue.start(QueueMode.CLIENT)` | `client.start()` |

### JobQueue → JobQueueWorker

| JobQueue (BOTH/SERVER mode) | JobQueueWorker |
|------------------------------|----------------|
| `queue.executeJob()` | `worker.executeJob()` |
| `queue.getStats()` | `worker.getStats()` |
| `queue.start(QueueMode.SERVER)` | `worker.start()` |
| `queue.stop()` | `worker.stop()` |

### JobQueue → JobQueueServer

| JobQueue | JobQueueServer |
|----------|----------------|
| Not available | `server.start()` |
| Not available | `server.getWorkerCount()` |
| `queue.getStats()` | `server.getStats()` (aggregated) |

## Storage Configuration

The new architecture works best with persistent storage:

### PostgreSQL (Recommended for Production)

```typescript
import { Pool } from "pg";
import { PostgresQueueStorage } from "@workglow/storage";

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const storage = new PostgresQueueStorage(pool, "queue-name");
```

### SQLite (Good for Single-Machine Deployments)

```typescript
import { SqliteQueueStorage } from "@workglow/storage";

const storage = new SqliteQueueStorage("./jobs.db", "queue-name");
```

## Deployment Patterns

### Pattern 1: Separate Services

```
┌─────────────┐
│ Web App     │──┐
│ (Client)    │  │
└─────────────┘  │      ┌──────────────┐
                 ├─────▶│  PostgreSQL  │
┌─────────────┐  │      └──────────────┘
│ API Service │──┤              ▲
│ (Client)    │  │              │
└─────────────┘  │              │
                 │              │
┌─────────────┐  │              │
│ Worker 1    │──┘              │
└─────────────┘                 │
                                │
┌─────────────┐                 │
│ Worker 2    │─────────────────┘
└─────────────┘
```

### Pattern 2: Server with Workers

```
┌─────────────┐
│ Client      │──┐
└─────────────┘  │      ┌──────────────┐
                 ├─────▶│  PostgreSQL  │
┌─────────────┐  │      └──────────────┘
│ Server      │──┘              ▲
│ (10 workers)│                 │
└─────────────┘─────────────────┘
```

### Pattern 3: Hybrid (for gradual migration)

```typescript
// Still use JobQueue in BOTH mode for now
const queue = new JobQueue("tasks", TaskJob, {
  storage: new PostgresQueueStorage(pool, "tasks"),
});

await queue.start(QueueMode.BOTH);

// Later, split into client and worker services
```

## Breaking Changes

None! The original `JobQueue` class is fully backward compatible.

## Benefits of Migration

1. **Scalability** - Scale workers independently
2. **Reliability** - Workers can restart without affecting clients
3. **Separation** - Clear boundaries between submission and processing
4. **Monitoring** - Better visibility into worker performance
5. **Flexibility** - Deploy components independently

## Common Issues

### Issue: Jobs not being processed

**Solution**: Make sure you have at least one worker running.

### Issue: Client can't see job progress

**Solution**: Ensure client and worker use the same storage backend with same connection details.

### Issue: High database load

**Solution**: Adjust `waitDurationInMilliseconds` to reduce polling frequency.

```typescript
const client = new JobQueueClient("tasks", TaskJob, storage, {
  waitDurationInMilliseconds: 5000, // Poll every 5 seconds instead of default 100ms
});
```

## Example Migration

See `examples/production-architecture.ts` for a complete working example.

## Support

For questions or issues, please open an issue on GitHub.
