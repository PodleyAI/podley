# @podley/storage

Modular storage solutions for Podley.AI platform with multiple backend implementations. Provides consistent interfaces for key-value storage, tabular data storage, and job queue persistence.

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
  - [Type Safety](#type-safety)
  - [Environment Compatibility](#environment-compatibility)
  - [Import Patterns](#import-patterns)
- [Storage Types](#storage-types)
  - [Key-Value Storage](#key-value-storage)
    - [Basic Usage](#basic-usage)
    - [Environment-Specific Examples](#environment-specific-examples)
    - [Bulk Operations](#bulk-operations)
    - [Event Handling](#event-handling)
  - [Tabular Storage](#tabular-storage)
    - [Schema Definition](#schema-definition)
    - [CRUD Operations](#crud-operations)
    - [Bulk Operations](#bulk-operations-1)
    - [Searching and Filtering](#searching-and-filtering)
    - [Environment-Specific Tabular Storage](#environment-specific-tabular-storage)
  - [Queue Storage](#queue-storage)
    - [Basic Job Queue Operations](#basic-job-queue-operations)
    - [Job Management](#job-management)
- [Environment-Specific Usage](#environment-specific-usage)
  - [Browser Environment](#browser-environment)
  - [Node.js Environment](#nodejs-environment)
  - [Bun Environment](#bun-environment)
- [Advanced Features](#advanced-features)
  - [Event-Driven Architecture](#event-driven-architecture)
  - [Compound Primary Keys](#compound-primary-keys)
  - [Custom File Layout (KV on filesystem)](#custom-file-layout-kv-on-filesystem)
- [API Reference](#api-reference)
  - [IKvRepository\<Key, Value\>](#ikvrepositorykey-value)
  - [ITabularRepository\<Schema, PrimaryKeyNames\>](#itabularrepositoryschema-primarykeynames)
  - [IQueueStorage\<Input, Output\>](#iqueuestorageinput-output)
- [Examples](#examples)
  - [User Management System](#user-management-system)
  - [Configuration Management](#configuration-management)
- [Testing](#testing)
  - [Writing Tests for Your Storage Usage](#writing-tests-for-your-storage-usage)
- [License](#license)

## Quick Start

```typescript
// Key-Value Storage (simple data)
import { InMemoryKvRepository } from "@podley/storage";

const kvStore = new InMemoryKvRepository<string, { name: string; age: number }>();
await kvStore.put("user:123", { name: "Alice", age: 30 });
const kvUser = await kvStore.get("user:123"); // { name: "Alice", age: 30 }
```

```typescript
// Tabular Storage (structured data with schemas)
import { InMemoryTabularRepository } from "@podley/storage";
import { Type } from "@sinclair/typebox";

const userSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String(),
  age: Type.Number(),
});

const userRepo = new InMemoryTabularRepository(
  userSchema,
  ["id"], // primary key
  ["email"] // additional indexes
);

await userRepo.put({ id: "123", name: "Alice", email: "alice@example.com", age: 30 });
const user = await userRepo.get({ id: "123" });
```

## Installation

```bash
# Using bun (recommended)
bun install @podley/storage

# Using npm
npm install @podley/storage

# Using yarn
yarn add @podley/storage
```

## Core Concepts

### Type Safety

All storage implementations are fully typed using TypeScript and TypeBox schemas for runtime validation:

```typescript
import { Type } from "@sinclair/typebox";

// Define your data structure
const ProductSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  price: Type.Number(),
  category: Type.String(),
  inStock: Type.Boolean(),
});

// TypeScript automatically infers:
// Entity = { id: string; name: string; price: number; category: string; inStock: boolean }
// PrimaryKey = { id: string }
```

### Environment Compatibility

| Storage Type | Node.js | Bun | Browser | Persistence |
| ------------ | ------- | --- | ------- | ----------- |
| InMemory     | ✅      | ✅  | ✅      | ❌          |
| IndexedDB    | ❌      | ❌  | ✅      | ✅          |
| SQLite       | ✅      | ✅  | ❌      | ✅          |
| PostgreSQL   | ✅      | ✅  | ❌      | ✅          |
| FileSystem   | ✅      | ✅  | ❌      | ✅          |

### Import Patterns

The package uses conditional exports, so importing from `@podley/storage` automatically selects the right build for your runtime (browser, Node.js, or Bun).

```typescript
// Import from the top-level package; it resolves to the correct target per environment
import { InMemoryKvRepository, SqliteTabularRepository } from "@podley/storage";
```

## Storage Types

### Key-Value Storage

Simple key-value storage for unstructured or semi-structured data.

#### Basic Usage

```typescript
import { InMemoryKvRepository, FsFolderJsonKvRepository } from "@podley/storage";

// In-memory (for testing/caching)
const cache = new InMemoryKvRepository<string, any>();
await cache.put("config", { theme: "dark", language: "en" });

// File-based JSON (persistent)
const settings = new FsFolderJsonKvRepository("./data/settings");
await settings.put("user:preferences", { notifications: true });
```

#### Environment-Specific Examples

```typescript
// Browser (using IndexedDB)
import { IndexedDbKvRepository } from "@podley/storage";
const browserStore = new IndexedDbKvRepository("my-app-storage");

// Node.js/Bun (using SQLite)
import { SqliteKvRepository } from "@podley/storage";
// Pass a file path or a Database instance (see @podley/sqlite)
const sqliteStore = new SqliteKvRepository("./data.db", "config_table");

// PostgreSQL (Node.js/Bun)
import { PostgresKvRepository } from "@podley/storage";
import { Pool } from "pg";
const pool = new Pool({ connectionString: "postgresql://..." });
const pgStore = new PostgresKvRepository(pool, "settings");
```

#### Bulk Operations

```typescript
const store = new InMemoryKvRepository<string, { name: string; score: number }>();

// Bulk insert
await store.putBulk([
  { key: "player1", value: { name: "Alice", score: 100 } },
  { key: "player2", value: { name: "Bob", score: 85 } },
]);

// Get all data
const allPlayers = await store.getAll();
// Result: [{ key: "player1", value: { name: "Alice", score: 100 } }, ...]

// Get size
const count = await store.size(); // 2
```

#### Event Handling

```typescript
const store = new InMemoryKvRepository<string, any>();

// Listen to storage events
store.on("put", (key, value) => {
  console.log(`Stored: ${key} = ${JSON.stringify(value)}`);
});

store.on("get", (key, value) => {
  console.log(`Retrieved: ${key} = ${value ? "found" : "not found"}`);
});

await store.put("test", { data: "example" }); // Triggers 'put' event
await store.get("test"); // Triggers 'get' event
```

### Tabular Storage

Structured storage with schemas, primary keys, and indexing for complex data relationships.

#### Schema Definition

```typescript
import { Type } from "@sinclair/typebox";
import { InMemoryTabularRepository } from "@podley/storage";

// Define your entity schema
const UserSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  age: Type.Number(),
  department: Type.String(),
  createdAt: Type.String(),
});

// Create repository with primary key and indexes
const userRepo = new InMemoryTabularRepository(
  UserSchema,
  ["id"], // Primary key (can be compound: ["dept", "id"])
  ["email", "department", ["department", "age"]] // Indexes for fast lookups
);
```

#### CRUD Operations

```typescript
// Create
await userRepo.put({
  id: "user_123",
  email: "alice@company.com",
  name: "Alice Johnson",
  age: 28,
  department: "Engineering",
  createdAt: new Date().toISOString(),
});

// Read by primary key
const user = await userRepo.get({ id: "user_123" });

// Update (put with same primary key)
await userRepo.put({
  ...user!,
  age: 29, // Birthday!
});

// Delete
await userRepo.delete({ id: "user_123" });
```

#### Bulk Operations

```typescript
// Bulk insert
await userRepo.putBulk([
  {
    id: "1",
    email: "alice@co.com",
    name: "Alice",
    age: 28,
    department: "Engineering",
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    email: "bob@co.com",
    name: "Bob",
    age: 32,
    department: "Sales",
    createdAt: "2024-01-02",
  },
  {
    id: "3",
    email: "carol@co.com",
    name: "Carol",
    age: 26,
    department: "Engineering",
    createdAt: "2024-01-03",
  },
]);

// Get all records
const allUsers = await userRepo.getAll();

// Get repository size
const userCount = await userRepo.size();
```

#### Searching and Filtering

```typescript
// Search by partial match (uses indexes when available)
const engineeringUsers = await userRepo.search({ department: "Engineering" });
const adultUsers = await userRepo.search({ age: 25 }); // Exact match

// Delete by search criteria
await userRepo.deleteSearch("department", "Sales", "=");
await userRepo.deleteSearch("age", 65, ">="); // Delete users 65 and older
```

#### Environment-Specific Tabular Storage

```typescript
// SQLite (Node.js/Bun)
import { SqliteTabularRepository } from "@podley/storage";

const sqliteUsers = new SqliteTabularRepository(
  "./users.db",
  "users",
  UserSchema,
  ["id"],
  ["email"]
);

// PostgreSQL (Node.js/Bun)
import { PostgresTabularRepository } from "@podley/storage";
import { Pool } from "pg";

const pool = new Pool({ connectionString: "postgresql://..." });
const pgUsers = new PostgresTabularRepository(pool, "users", UserSchema, ["id"], ["email"]);

// IndexedDB (Browser)
import { IndexedDbTabularRepository } from "@podley/storage";
const browserUsers = new IndexedDbTabularRepository("users", UserSchema, ["id"], ["email"]);

// File-based (Node.js/Bun)
import { FsFolderTabularRepository } from "@podley/storage";
const fileUsers = new FsFolderTabularRepository("./data/users", UserSchema, ["id"], ["email"]);
```

### Queue Storage

Persistent job queue storage for background processing and task management.

> **Note**: Queue storage is primarily used internally by the job queue system. Direct usage is for advanced scenarios.

#### Basic Job Queue Operations

```typescript
import { InMemoryQueueStorage, JobStatus } from "@podley/storage";

// Define job input/output types
type ProcessingInput = { text: string; options: any };
type ProcessingOutput = { result: string; metadata: any };

const jobQueue = new InMemoryQueueStorage<ProcessingInput, ProcessingOutput>();

// Add job to queue
const jobId = await jobQueue.add({
  input: { text: "Hello world", options: { uppercase: true } },
  run_after: null, // Run immediately
  max_retries: 3,
});

// Get next job for processing
const job = await jobQueue.next();
if (job) {
  // Process the job...
  const result = { result: "HELLO WORLD", metadata: { processed: true } };

  // Mark as complete
  await jobQueue.complete({
    ...job,
    output: result,
    status: JobStatus.COMPLETED,
  });
}
```

#### Job Management

```typescript
// Check queue status
const pendingCount = await jobQueue.size(JobStatus.PENDING);
const processingCount = await jobQueue.size(JobStatus.PROCESSING);

// Peek at jobs without removing them
const nextJobs = await jobQueue.peek(JobStatus.PENDING, 5);

// Progress tracking
await jobQueue.saveProgress(jobId, 50, "Processing...", { step: 1 });

// Handle job failures
await jobQueue.abort(jobId);

// Cleanup old completed jobs
await jobQueue.deleteJobsByStatusAndAge(JobStatus.COMPLETED, 24 * 60 * 60 * 1000); // 24 hours
```

## Environment-Specific Usage

### Browser Environment

```typescript
import {
  IndexedDbKvRepository,
  IndexedDbTabularRepository,
  IndexedDbQueueStorage,
} from "@podley/storage";

// All data persists in IndexedDB
const settings = new IndexedDbKvRepository("app-settings");
const userData = new IndexedDbTabularRepository("users", UserSchema, ["id"]);
const jobQueue = new IndexedDbQueueStorage<any, any>("background-jobs");
```

### Node.js Environment

```typescript
import {
  SqliteKvRepository,
  PostgresTabularRepository,
  FsFolderJsonKvRepository,
} from "@podley/storage";

// Mix and match storage backends
const cache = new FsFolderJsonKvRepository("./cache");
const users = new PostgresTabularRepository(pool, "users", UserSchema, ["id"]);
```

### Bun Environment

```typescript
// Bun has access to all implementations
import {
  SqliteTabularRepository,
  FsFolderJsonKvRepository,
  PostgresQueueStorage,
} from "@podley/storage";

import { Database } from "bun:sqlite";

const db = new Database("./app.db");
const data = new SqliteTabularRepository(db, "items", ItemSchema, ["id"]);
```

## Advanced Features

### Event-Driven Architecture

All storage implementations support event emission for monitoring and reactive programming:

```typescript
const store = new InMemoryTabularRepository(UserSchema, ["id"]);

// Monitor all operations
store.on("put", (entity) => console.log("User created/updated:", entity));
store.on("delete", (key) => console.log("User deleted:", key));
store.on("get", (key, entity) => console.log("User accessed:", entity ? "found" : "not found"));

// Wait for specific events
const [entity] = await store.waitOn("put"); // Waits for next put operation
```

### Compound Primary Keys

```typescript
const OrderLineSchema = Type.Object({
  orderId: Type.String(),
  lineNumber: Type.Number(),
  productId: Type.String(),
  quantity: Type.Number(),
  price: Type.Number(),
});

const orderLines = new InMemoryTabularRepository(
  OrderLineSchema,
  ["orderId", "lineNumber"], // Compound primary key
  ["productId"] // Additional index
);

// Use compound keys
await orderLines.put({
  orderId: "ORD-123",
  lineNumber: 1,
  productId: "PROD-A",
  quantity: 2,
  price: 19.99,
});
const line = await orderLines.get({ orderId: "ORD-123", lineNumber: 1 });
```

### Custom File Layout (KV on filesystem)

```typescript
import { FsFolderKvRepository } from "@podley/storage";
import { Type } from "@sinclair/typebox";

// Control how keys map to file paths and value encoding via schemas
const files = new FsFolderKvRepository<string, string>(
  "./data/files",
  (key) => `${key}.txt`,
  Type.String(),
  Type.String()
);

await files.put("note-1", "Hello world");
```

## API Reference

### IKvRepository<Key, Value>

Core interface for key-value storage:

```typescript
interface IKvRepository<Key, Value> {
  // Core operations
  put(key: Key, value: Value): Promise<void>;
  putBulk(items: Array<{ key: Key; value: Value }>): Promise<void>;
  get(key: Key): Promise<Value | undefined>;
  delete(key: Key): Promise<void>;
  getAll(): Promise<Array<{ key: Key; value: Value }> | undefined>;
  deleteAll(): Promise<void>;
  size(): Promise<number>;

  // Event handling
  on(event: "put" | "get" | "getAll" | "delete" | "deleteall", callback: Function): void;
  off(event: string, callback: Function): void;
  once(event: string, callback: Function): void;
  waitOn(event: string): Promise<any[]>;
  emit(event: string, ...args: any[]): void;
}
```

### ITabularRepository<Schema, PrimaryKeyNames>

Core interface for tabular storage:

```typescript
interface ITabularRepository<Schema, PrimaryKeyNames> {
  // Core operations
  put(entity: Entity): Promise<void>;
  putBulk(entities: Entity[]): Promise<void>;
  get(key: PrimaryKey): Promise<Entity | undefined>;
  delete(key: PrimaryKey | Entity): Promise<void>;
  getAll(): Promise<Entity[] | undefined>;
  deleteAll(): Promise<void>;
  size(): Promise<number>;

  // Search operations
  search(criteria: Partial<Entity>): Promise<Entity[] | undefined>;
  deleteSearch(
    column: keyof Entity,
    value: any,
    operator: "=" | "<" | "<=" | ">" | ">="
  ): Promise<void>;

  // Event handling
  on(event: "put" | "get" | "search" | "delete" | "clearall", callback: Function): void;
  off(event: string, callback: Function): void;
  once(event: string, callback: Function): void;
  waitOn(event: string): Promise<any[]>;
  emit(event: string, ...args: any[]): void;
}
```

### IQueueStorage<Input, Output>

Core interface for job queue storage:

```typescript
interface IQueueStorage<Input, Output> {
  add(job: JobStorageFormat<Input, Output>): Promise<unknown>;
  get(id: unknown): Promise<JobStorageFormat<Input, Output> | undefined>;
  next(): Promise<JobStorageFormat<Input, Output> | undefined>;
  complete(job: JobStorageFormat<Input, Output>): Promise<void>;
  peek(status?: JobStatus, num?: number): Promise<JobStorageFormat<Input, Output>[]>;
  size(status?: JobStatus): Promise<number>;
  abort(id: unknown): Promise<void>;
  saveProgress(id: unknown, progress: number, message: string, details: any): Promise<void>;
  deleteAll(): Promise<void>;
  getByRunId(runId: string): Promise<Array<JobStorageFormat<Input, Output>>>;
  outputForInput(input: Input): Promise<Output | null>;
  delete(id: unknown): Promise<void>;
  deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void>;
}
```

## Examples

### User Management System

```typescript
import { Type } from "@sinclair/typebox";
import { InMemoryTabularRepository, InMemoryKvRepository } from "@podley/storage";

// User profile with tabular storage
const UserSchema = Type.Object({
  id: Type.String(),
  username: Type.String(),
  email: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
  role: Type.Union([Type.Literal("admin"), Type.Literal("user"), Type.Literal("guest")]),
  createdAt: Type.String(),
  lastLoginAt: Type.Optional(Type.String()),
});

const userRepo = new InMemoryTabularRepository(UserSchema, ["id"], ["email", "username"]);

// User sessions with KV storage
const sessionStore = new InMemoryKvRepository<string, { userId: string; expiresAt: string }>();

// User management class
class UserManager {
  constructor(
    private userRepo: typeof userRepo,
    private sessionStore: typeof sessionStore
  ) {}

  async createUser(userData: Omit<Static<typeof UserSchema>, "id" | "createdAt">) {
    const user = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await this.userRepo.put(user);
    return user;
  }

  async loginUser(email: string): Promise<string> {
    const users = await this.userRepo.search({ email });
    if (!users?.length) throw new Error("User not found");

    const sessionId = crypto.randomUUID();
    await this.sessionStore.put(sessionId, {
      userId: users[0].id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Update last login
    await this.userRepo.put({
      ...users[0],
      lastLoginAt: new Date().toISOString(),
    });

    return sessionId;
  }

  async getSessionUser(sessionId: string) {
    const session = await this.sessionStore.get(sessionId);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }
    return this.userRepo.get({ id: session.userId });
  }
}
```

### Configuration Management

```typescript
// Application settings with typed configuration
type AppConfig = {
  database: {
    host: string;
    port: number;
    name: string;
  };
  features: {
    enableNewUI: boolean;
    maxUploadSize: number;
  };
  integrations: {
    stripe: { apiKey: string; webhook: string };
    sendgrid: { apiKey: string };
  };
};

const configStore = new FsFolderJsonKvRepository<string, AppConfig>("./config");

class ConfigManager {
  private cache = new Map<string, AppConfig>();

  constructor(private store: typeof configStore) {
    // Listen for config changes
    store.on("put", (key, value) => {
      this.cache.set(key, value);
      console.log(`Configuration updated: ${key}`);
    });
  }

  async getConfig(environment: string): Promise<AppConfig> {
    if (this.cache.has(environment)) {
      return this.cache.get(environment)!;
    }

    const config = await this.store.get(environment);
    if (!config) throw new Error(`No configuration for environment: ${environment}`);

    this.cache.set(environment, config);
    return config;
  }

  async updateConfig(environment: string, updates: Partial<AppConfig>) {
    const current = await this.getConfig(environment);
    const updated = { ...current, ...updates };
    await this.store.put(environment, updated);
  }
}
```

## Testing

The package includes comprehensive test suites for all storage implementations:

```bash
# Run all tests
bun test

# Run specific test suites
bun test --grep "KvRepository"
bun test --grep "TabularRepository"
bun test --grep "QueueStorage"

# Test specific environments
bun test --grep "InMemory"    # Cross-platform tests
bun test --grep "IndexedDb"   # Browser tests
bun test --grep "Sqlite"      # Native tests
```

### Writing Tests for Your Storage Usage

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { InMemoryTabularRepository } from "@podley/storage";

describe("UserRepository", () => {
  let userRepo: InMemoryTabularRepository<typeof UserSchema, ["id"]>;

  beforeEach(() => {
    userRepo = new InMemoryTabularRepository(UserSchema, ["id"], ["email"]);
  });

  test("should create and retrieve user", async () => {
    const user = {
      id: "test-123",
      email: "test@example.com",
      name: "Test User",
      age: 25,
      department: "Engineering",
      createdAt: new Date().toISOString(),
    };

    await userRepo.put(user);
    const retrieved = await userRepo.get({ id: "test-123" });

    expect(retrieved).toEqual(user);
  });

  test("should find users by department", async () => {
    const users = [
      {
        id: "1",
        email: "alice@co.com",
        name: "Alice",
        age: 28,
        department: "Engineering",
        createdAt: "2024-01-01",
      },
      {
        id: "2",
        email: "bob@co.com",
        name: "Bob",
        age: 32,
        department: "Sales",
        createdAt: "2024-01-02",
      },
    ];

    await userRepo.putBulk(users);
    const engineers = await userRepo.search({ department: "Engineering" });

    expect(engineers).toHaveLength(1);
    expect(engineers![0].name).toBe("Alice");
  });
});
```

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details
