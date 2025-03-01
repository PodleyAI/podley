# Tabular Repository Implementations

A collection of storage implementations for tabular data with multiple backend support. Provides consistent CRUD operations, search capabilities, and event monitoring across different storage technologies.

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Implementations](#implementations)
  - [InMemoryTabularRepository](#inmemorytabularrepository)
  - [SqliteTabularRepository](#sqlitetabularrepository)
  - [PostgresTabularRepository](#postgrestabularrepository)
  - [IndexedDbTabularRepository](#indexeddbtabularrepository)
  - [FsFolderTabularRepository](#fsfoldertabularrepository)
- [Events](#events)
- [Testing](#testing)
- [License](#license)

## Features

- Multiple storage backends:
  - In-memory (for testing/caching)
  - SQLite (embedded database)
  - PostgreSQL (relational database)
  - IndexedDB (browser storage)
  - Filesystem (JSON file per record)
- Type-safe schema definitions
- Compound primary keys support
- Indexing for efficient search
- Event-driven architecture
- Cross-implementation test suite

## Installation

```bash
bun add @ellmers/storage
# or
npm install @ellmers/storage
```

## Basic Usage

```typescript
import { InMemoryTabularRepository } from "@ellmers/storage/tabular";

// Define schema and primary keys
const schema = {
  id: "string",
  name: "string",
  age: "number",
  active: "boolean",
} as const;

const primaryKeys = ["id"] as const;

// Create repository instance
const repo = new InMemoryTabularRepository<typeof schema, typeof primaryKeys>(schema, primaryKeys);

// Basic operations
await repo.put({ id: "1", name: "Alice", age: 30, active: true });
const result = await repo.get({ id: "1" });
await repo.delete({ id: "1" });
```

## Implementations

### InMemoryTabularRepository

- Ideal for testing/development
- No persistence
- Fast search capabilities

```typescript
const repo = new InMemoryTabularRepository(schema, primaryKeys, ["name", "active"]);
```

### SqliteTabularRepository

- Embedded SQLite database
- File-based or in-memory

```typescript
const repo = new SqliteTabularRepository(
  ":memory:", // Database path
  "users", // Table name
  schema,
  primaryKeys,
  [["name", "active"], "age"] // Indexes
);
```

### PostgresTabularRepository

- PostgreSQL backend
- Connection pooling support

```typescript
import { Pool } from "pg";

const pool = new Pool({
  /* config */
});
const repo = new PostgresTabularRepository(
  pool, // postgres connection pool
  "users",
  schema,
  primaryKeys,
  [["name", "active"], "age"]
);
```

### IndexedDbTabularRepository

- Browser-based storage
- Automatic schema migration

```typescript
const repo = new IndexedDbTabularRepository(
  "user_db", // Database name
  schema,
  primaryKeys,
  [["name", "active"], "age"]
);
```

### FsFolderTabularRepository

- Filesystem storage (one JSON file per record)
- Simple persistence format

```typescript
const repo = new FsFolderTabularRepository("./data/users", schema, primaryKeys);
```

## Events

All implementations emit events:

- `put`: When a record is created/updated
- `get`: When a record is retrieved
- `delete`: When a record is deleted
- `clearall`: When all records are deleted
- `search`: When a search is performed

```typescript
repo.on("put", (entity) => {
  console.log("Record stored:", entity);
});

repo.on("delete", (key) => {
  console.log("Record deleted:", key);
});
```

## Testing

The implementations share a common test suite. To run tests:

```bash
bun test
```

Test includes:

- Basic CRUD operations
- Compound key handling
- Index-based search
- Event emission
- Concurrency tests

## License

Apache 2.0
