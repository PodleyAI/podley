# @podley/util

Utility functions and helper classes for Podley AI task pipelines.

## Overview

The `@podley/util` package provides a comprehensive set of utility functions, helper classes, and common functionality used throughout the Podley ecosystem. It includes utilities for cryptography, compression, graph operations, dependency injection, event handling, and more.

## Installation

```bash
npm install @podley/util
# or
bun add @podley/util
```

## Platform Support

This package works across browser, Node.js, and Bun environments with platform-specific optimizations:

- **Browser**: Uses Web APIs and includes browser-specific implementations
- **Node.js**: Uses Node.js built-in modules for optimal performance  
- **Bun**: Optimized for Bun runtime with native API integration

## Core Modules

### Graph Operations

The package provides robust graph data structures with cycle detection and topological sorting:

```typescript
import { DirectedGraph, DirectedAcyclicGraph } from "@podley/util";

// Create a directed graph
const graph = new DirectedGraph<string>();
graph.addNode("A");
graph.addNode("B"); 
graph.addNode("C");
graph.addEdge("A", "B");
graph.addEdge("B", "C");

// Check for cycles
const isAcyclic = graph.isAcyclic(); // true

// Convert to DAG (throws if cycles exist)
const dag = DirectedAcyclicGraph.fromDirectedGraph(graph);

// Get topological ordering
const sorted = dag.getTopologicalSort(); // ["A", "B", "C"]

// Get all nodes that depend on a node
const dependents = dag.getDependentsOf("A"); // ["B", "C"]

// Get all dependencies of a node  
const dependencies = dag.getDependenciesOf("C"); // ["A", "B"]
```

### Dependency Injection

Simple but effective dependency injection container:

```typescript
import { Container } from "@podley/util";

// Create container
const container = new Container();

// Register services
container.register("database", () => new DatabaseService());
container.register("userService", () => new UserService(container.get("database")));

// Register instances directly
container.registerInstance("config", { apiUrl: "https://api.example.com" });

// Resolve dependencies
const userService = container.get<UserService>("userService");
const config = container.get<ConfigType>("config");
```

### Event System

Type-safe event emitter with support for one-time listeners:

```typescript
import { EventEmitter } from "@podley/util";

// Define event types
interface Events {
  userLogin: (user: User) => void;
  dataUpdate: (data: any[]) => void;
  error: (error: Error) => void;
}

const emitter = new EventEmitter<Events>();

// Add event listeners
emitter.on("userLogin", (user) => {
  console.log(`User ${user.name} logged in`);
});

// One-time listeners
emitter.once("dataUpdate", (data) => {
  console.log("Initial data loaded:", data.length);
});

// Emit events
emitter.emit("userLogin", { id: 1, name: "John" });
emitter.emit("dataUpdate", [1, 2, 3]);

// Remove listeners
emitter.off("userLogin", loginHandler);
emitter.removeAllListeners("error");
```

### Cryptography

Basic cryptographic utilities (platform-optimized):

```typescript
import { sha256, makeFingerprint, uuid4 } from "@podley/util";

// Generate SHA-256 hash
const hash = await sha256("my-data");

// Create fingerprint of any object
const fingerprint = await makeFingerprint({ 
  id: 123, 
  data: "some-content" 
});

// Generate UUID v4
const id = uuid4(); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

### Compression

Data compression and decompression (GZIP and Brotli):

```typescript
import { compress, decompress } from "@podley/util";

// Compress data (default: gzip)
const compressed = await compress("large text data to compress...");

// Compress with specific algorithm
const brotliCompressed = await compress("data", "br");

// Decompress
const original = await decompress(compressed);
const brotliOriginal = await decompress(brotliCompressed, "br");
```

### Worker Management

Manage and communicate with web workers:

```typescript
import { WorkerManager } from "@podley/util";

const manager = new WorkerManager();

// Register a worker
const worker = new Worker("./my-worker.js");
manager.registerWorker("dataProcessor", worker);

// Call functions in the worker
const result = await manager.callWorkerFunction(
  "dataProcessor",
  "processData", 
  [{ input: "data to process" }]
);

// Get worker instance
const workerInstance = manager.getWorker("dataProcessor");
```

### TypeBox Extensions

Enhanced TypeBox utilities for schema validation:

```typescript
import { 
  TypeOptionalArray, 
  TypeDateTime, 
  TypeNullable, 
  TypeStringEnum,
  areSemanticallyCompatible 
} from "@podley/util";

// Optional array type (value or array of values)
const UserIds = TypeOptionalArray(Type.String());
// Accepts: "user1" or ["user1", "user2"]

// Date/time types
const CreatedAt = TypeDateTime();
const BirthDate = TypeDate();

// Nullable types
const OptionalName = TypeNullable(Type.String());

// String enums
const Status = TypeStringEnum(["active", "inactive", "pending"]);

// Check schema compatibility
const compatibility = areSemanticallyCompatible(outputSchema, inputSchema);
// Returns: "static" | "runtime" | "incompatible"
```

### Utility Functions

Common helper functions for everyday tasks:

```typescript
import { 
  forceArray, 
  sleep, 
  collectPropertyValues,
  toSQLiteTimestamp,
  serialize 
} from "@podley/util";

// Ensure value is an array
const items = forceArray("single-item"); // ["single-item"]
const alreadyArray = forceArray([1, 2, 3]); // [1, 2, 3]

// Async sleep
await sleep(1000); // Wait 1 second

// Collect property values from array of objects
const users = [
  { name: "John", age: 30 },
  { name: "Jane", age: 25 }
];
const collected = collectPropertyValues(users);
// { name: ["John", "Jane"], age: [30, 25] }

// Convert Date to SQLite timestamp
const timestamp = toSQLiteTimestamp(new Date());
// "2024-01-15 14:30:45"

// Serialize objects consistently
const serialized = serialize({ b: 2, a: 1 });
// Always produces same string regardless of property order
```

### Array/Object Transformation

Advanced utilities for working with arrays of objects:

```typescript
import { objectOfArraysAsArrayOfObjects } from "@podley/util";

// Transform object of arrays to array of objects
const input = {
  names: ["John", "Jane", "Bob"],
  ages: [30, 25, 35],
  cities: ["NYC", "LA", "Chicago"]
};

const transformed = objectOfArraysAsArrayOfObjects(input);
// [
//   { names: "John", ages: 30, cities: "NYC" },
//   { names: "Jane", ages: 25, cities: "LA" },
//   { names: "Bob", ages: 35, cities: "Chicago" }
// ]
```

## Error Handling

The package includes custom error types for better error handling:

```typescript
import { BaseError } from "@podley/util";

// Custom error with additional context
class ValidationError extends BaseError {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "ValidationError";
  }
}

try {
  throw new ValidationError("Invalid email format", "email");
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed for field: ${error.field}`);
  }
}
```

## Platform-Specific Usage

### Browser Environment

```typescript
// Browser-specific imports automatically selected
import { sha256, compress, Worker } from "@podley/util";

// Uses WebCrypto API for hashing
const hash = await sha256("data");

// Uses CompressionStream API
const compressed = await compress("data");
```

### Node.js Environment  

```typescript
// Node-specific implementations used
import { sha256, compress } from "@podley/util";

// Uses Node.js crypto module
const hash = await sha256("data");

// Uses zlib module
const compressed = await compress("data");
```

### Bun Environment

```typescript
// Bun-optimized implementations
import { sha256, compress } from "@podley/util";

// Uses Bun.CryptoHasher
const hash = await sha256("data");

// Uses Node.js zlib (Bun compatible)
const compressed = await compress("data");
```

## Common Patterns

### Building Task Dependencies

```typescript
import { DirectedAcyclicGraph } from "@podley/util";

// Model task dependencies
const taskGraph = new DirectedAcyclicGraph<string>();

taskGraph.addNode("fetchData");
taskGraph.addNode("processData");  
taskGraph.addNode("saveResults");

taskGraph.addEdge("fetchData", "processData");
taskGraph.addEdge("processData", "saveResults");

// Execute tasks in dependency order
const executionOrder = taskGraph.getTopologicalSort();
for (const taskId of executionOrder) {
  await executeTask(taskId);
}
```

### Service Container Pattern

```typescript
import { Container } from "@podley/util";

// Setup application services
const container = new Container();

container.register("logger", () => new Logger());
container.register("database", () => new Database(container.get("logger")));
container.register("userRepo", () => new UserRepository(container.get("database")));

// Use throughout application
const userRepo = container.get<UserRepository>("userRepo");
```

### Event-Driven Architecture

```typescript
import { EventEmitter } from "@podley/util";

interface AppEvents {
  taskStarted: (taskId: string) => void;
  taskCompleted: (taskId: string, result: any) => void;
  taskFailed: (taskId: string, error: Error) => void;
}

const eventBus = new EventEmitter<AppEvents>();

// Set up listeners
eventBus.on("taskStarted", (taskId) => {
  console.log(`Task ${taskId} started`);
});

eventBus.on("taskCompleted", (taskId, result) => {
  console.log(`Task ${taskId} completed with result:`, result);
});

// Emit events from your application
eventBus.emit("taskStarted", "task-123");
```

## TypeScript Support

This package is written in TypeScript and provides full type safety:

```typescript
// All APIs are fully typed
const graph = new DirectedAcyclicGraph<TaskData, EdgeInfo>();
const container = new Container();
const emitter = new EventEmitter<MyEventTypes>();

// Generic type support
const result = container.get<UserService>("userService");
const hash = await sha256("data"); // string
const compressed = await compress("data"); // Uint8Array
```

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
