# @podley/storage

Modular storage solutions for ELLMERS platform with multiple backend implementations. Provides consistent interfaces for key-value storage and job queue persistence.

- [Features](#features)
- [Installation](#installation)
- [Modules](#modules)
  - [Tabular Storage](#tabular-storage)
  - [Key-Value Storage](#key-value-storage)
  - [Job Queue Storage](#job-queue-storage)
- [API Overview](#api-overview)
  - [Core Interfaces](#core-interfaces)
- [Testing](#testing)
- [Environment Compatibility](#environment-compatibility)
- [License](#license)

## Features

- **Multi-backend Support**
  - Tabular Storage: SQLite, PostgreSQL, Filesystem, Memory
  - Key-Value Stores: IndexedDB, SQLite, PostgreSQL, Filesystem, Memory
  - Queue Storage: IndexedDB, SQLite, PostgreSQL, Memory
- **Cross-platform** - Works in Node.js, Bun, and browsers
- **Type-safe APIs** with JSON serialization support
- **Event-driven architecture** for operation monitoring
- **ACID-compliant transactions** where supported

## Installation

```bash
bun install @podley/storage
```

## Modules

### Tabular Storage

Structured data storage with schema support for complex operations:

```typescript
import { SqliteTabularRepository } from "@podley/storage/tabular";

const tabularStore = new SqliteTabularRepository(
  database,
  "user_profiles", // table name
  { id: "integer", name: "string" }, // schema
  ["id"], // primary key
  ["name"] // additional indexes
);
```

[Full Tabular Storage Documentation →](./src/tabular/README.md)

### Key-Value Storage

Flexible key-value storage with multiple implementations:

```typescript
import { FsFolderKvRepository } from "@podley/storage/kv";

const kvStore = new FsFolderKvRepository("./data", "string", "json");
await kvStore.put("config", { darkMode: true });
```

[Full Key-Value Documentation →](./src/kv/README.md)

### Job Queue Storage

Persistent job queue implementations with lifecycle management (_not meant to be used directly_):

```typescript
import { IndexedDbQueueStorage } from "@podley/storage/queue";

const jobQueue = new IndexedDbQueueStorage("processing-queue");
await jobQueue.add({ input: "process_data" });
```

[Full Queue Storage Documentation →](./src/queue/README.md)

## API Overview

### Core Interfaces

```ts
interface ITabularRepository<typeof Schema, typeof PrimaryKey> {
  put(key: Entity): Promise<void>;
  get(key: Key): Promise<Value | undefined>;
  delete(key: Key): Promise<void>;
}

interface IKvRepository<KeyType, ValueType> {
  put(key: KeyType, value: ValueType): Promise<void>;
  get(key: KeyType): Promise<ValueType | undefined>;
  delete(key: KeyType): Promise<void>;
}

interface IQueueStorage<Input, Output> {
  add(job: JobFormat): Promise<ID>;
  next(): Promise<JobFormat | undefined>;
  complete(job: JobFormat): Promise<void>;
}
```

## Testing

Run all tests:

```bash
bun test
```

## Environment Compatibility

| Storage      | Node | Bun | Browser |
| ------------ | ---- | --- | ------- |
| InMemory     | ✅   | ✅  | ✅      |
| IndexedDB    | ❌   | ❌  | ✅      |
| Bun:SQLite   | ❌   | ✅  | ❌      |
| BetterSQLite | ✅   | ❌  | ❌      |
| PostgreSQL   | ✅   | ✅  | ❌      |

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details
