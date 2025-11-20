# @podley/util

Utility functions and helper classes for Podley AI task pipelines.

## Overview

The `@podley/util` package provides a comprehensive set of utility functions, helper classes, and common functionality used throughout the Podley ecosystem. It includes utilities for cryptography, compression, graph operations, dependency injection, event handling, and more.

## Features

- **Cryptography**: Hashing, encryption, and security utilities
- **Compression**: Data compression and decompression utilities
- **Graph Operations**: Graph traversal and manipulation utilities
- **Dependency Injection**: Simple DI container for managing dependencies
- **Event System**: Event emitter and handling utilities
- **Worker Utilities**: Web worker and background task helpers
- **JSON Schema Utilities**: JSON Schema types and utilities for schema validation and type inference
- **Multi-Platform Support**: Works in browser, Node.js, and Bun environments

## Installation

```bash
npm install @podley/util
# or
bun add @podley/util
```

## Usage

### Cryptography Utilities

```typescript
import { hash, encrypt, decrypt, generateKey } from "@podley/util/crypto";

// Hash data
const hashedData = await hash("my-data", "sha256");

// Generate encryption key
const key = await generateKey();

// Encrypt/decrypt data
const encrypted = await encrypt("sensitive-data", key);
const decrypted = await decrypt(encrypted, key);
```

### Compression Utilities

```typescript
import { compress, decompress } from "@podley/util/compress";

// Compress data
const compressed = await compress("large text data...");

// Decompress data
const decompressed = await decompress(compressed);
```

### Graph Operations

```typescript
import { topologicalSort, findCycles, shortestPath, GraphNode } from "@podley/util/graph";

// Create graph nodes
const nodes: GraphNode[] = [
  { id: "A", dependencies: [] },
  { id: "B", dependencies: ["A"] },
  { id: "C", dependencies: ["A", "B"] },
];

// Topological sort
const sorted = topologicalSort(nodes);

// Find cycles
const cycles = findCycles(nodes);

// Find shortest path
const path = shortestPath(nodes, "A", "C");
```

### Dependency Injection

```typescript
import { Container, injectable, inject } from "@podley/util/di";

@injectable()
class DatabaseService {
  connect() {
    // Database connection logic
  }
}

@injectable()
class UserService {
  constructor(@inject("DatabaseService") private db: DatabaseService) {}

  getUsers() {
    this.db.connect();
    // User retrieval logic
  }
}

// Create container and register services
const container = new Container();
container.register("DatabaseService", DatabaseService);
container.register("UserService", UserService);

// Resolve dependencies
const userService = container.resolve<UserService>("UserService");
```

### Event System

```typescript
import { EventEmitter, createEventBus } from "@podley/util/events";

// Basic event emitter
const emitter = new EventEmitter();

emitter.on("data", (data) => {
  console.log("Received:", data);
});

emitter.emit("data", { message: "Hello World" });

// Event bus for cross-component communication
const eventBus = createEventBus();

eventBus.subscribe("task:completed", (task) => {
  console.log("Task completed:", task.id);
});

eventBus.publish("task:completed", { id: "task-123" });
```

### Worker Utilities

```typescript
import { createWorkerPool, WorkerTask, WorkerPool } from "@podley/util/worker";

// Create worker pool
const pool: WorkerPool = createWorkerPool({
  workerScript: "./worker.js",
  poolSize: 4,
  maxQueueSize: 100,
});

// Execute task in worker
const result = await pool.execute({
  type: "process-data",
  data: { input: "some data" },
});

// Clean up
await pool.terminate();
```

### JSON Schema Utilities

```typescript
import { JsonSchema, FromSchema, DataPortSchema, compileSchema } from "@podley/util";

// Define a JSON Schema
const userSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    age: { type: "number", minimum: 0, maximum: 150 },
  },
  required: ["id", "email"],
  additionalProperties: false,
} as const satisfies JsonSchema;

// Infer TypeScript types from schema
type User = FromSchema<typeof userSchema>;
// => { id: string; email: string; age?: number }

// Compile schema for runtime validation
const validator = compileSchema(userSchema);
const isValid = validator.validate({
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "user@example.com",
  age: 25,
});
```

## Utility Categories

### Cryptography (`/crypto`)

- Hashing functions (SHA-256, SHA-512, etc.)
- Symmetric and asymmetric encryption
- Key generation and management
- Digital signatures
- Secure random number generation

### Compression (`/compress`)

- GZIP compression/decompression
- Brotli compression/decompression
- Custom compression algorithms
- Stream-based compression

### Graph Operations (`/graph`)

- Topological sorting
- Cycle detection
- Shortest path algorithms
- Graph traversal (DFS, BFS)
- Strongly connected components

### Dependency Injection (`/di`)

- Lightweight DI container
- Decorator-based injection
- Singleton and transient lifetimes
- Circular dependency detection

### Event System (`/events`)

- Type-safe event emitter
- Event bus for decoupled communication
- Event filtering and transformation
- Async event handling

### Worker Utilities (`/worker`)

- Worker pool management
- Task queuing and distribution
- Worker lifecycle management
- Error handling and recovery

### JSON Schema Utilities (`/json-schema`)

- `JsonSchema` - Extended JSON Schema type with custom extensions
- `FromSchema` - Infer TypeScript types from JSON schemas
- `DataPortSchema` - Schema type for task input/output ports
- `compileSchema` - Runtime schema validation using json-schema-library
- Schema compatibility utilities for task graph dataflows

### General Utilities (`/utilities`)

- Debounce and throttle functions
- Deep object merging
- Array and object utilities
- String manipulation helpers
- Date and time utilities

## Environment-Specific Features

### Browser

- Web Worker support
- IndexedDB utilities
- Blob and File handling
- WebCrypto API integration

### Node.js

- File system utilities
- Process management
- Native crypto support
- Stream processing

### Bun

- Optimized for Bun runtime
- Fast startup and execution
- Built-in APIs integration

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
