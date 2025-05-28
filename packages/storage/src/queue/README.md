# ELLMERS Queue Storage Package

This is not a job queue implementation. It is a storage implementation for job queues. See the [@podley/job-queue](../../../job-queue/README.md) package for a job queue implementation that uses these storage implementations.

- [Features](#features)
- [Performance Considerations](#performance-considerations)
- [Job Lifecycle](#job-lifecycle)

## Features

- Multiple storage implementations:
  - `InMemoryQueueStorage` - Volatile memory (dev/testing)
  - `IndexedDbQueueStorage` - Browser-based storage
  - `SqliteQueueStorage` - Embedded SQLite
  - `PostgresQueueStorage` - Production-grade PostgreSQL
- Job lifecycle management:
  - PENDING → PROCESSING → COMPLETED/FAILED/ABORTED
  - PENDING → SKIPPED
  - Automatic retry mechanisms
  - Progress tracking with message/details
- Fingerprint-based input deduplication
- Transactional operations with SKIP LOCKED
- Job expiration policies

## Performance Considerations

1. **IndexedDB**: Best for client-side applications with <10k jobs
2. **SQLite**: Ideal for single-process applications
3. **PostgreSQL**: Recommended for distributed systems with high throughput
4. **In-Memory**: Suitable for testing/development only

## Job Lifecycle

1. Jobs start as `PENDING`
2. Acquired via `next()` → `PROCESSING`
3. Final states:
   - `COMPLETED`: Successful execution
   - `FAILED`: Unrecoverable error
   - `ABORTED`: Manual cancellation
   - `SKIPPED`: Skipped due to conditions not met
   - Auto-retried while `PENDING` if within retry limits
