# @podley/sqlite

SQLite storage implementations for Podley AI task pipelines.

## Overview

The `@podley/sqlite` package provides SQLite-based storage implementations for Podley's task execution system. It offers cross-platform SQLite support for browser, Node.js, and Bun environments with different SQLite implementations optimized for each platform.

## Features

- **Multi-Platform SQLite**: Different SQLite implementations for browser, Node.js, and Bun
- **Browser Support**: WebAssembly-based SQLite for browser environments
- **Node.js Support**: Native SQLite bindings for server environments
- **Bun Support**: Optimized SQLite implementation for Bun runtime

## Installation

```bash
bun add @podley/sqlite
```

## Usage

### Browser Environment

```typescript
import { SqliteStorage } from "@podley/sqlite/browser";

const storage = new SqliteStorage({
  database: ":memory:",
});
```

### Node.js Environment

```typescript
import { SqliteStorage } from "@podley/sqlite/node";

const storage = new SqliteStorage({
  database: "./data/my-app.db",
});
```

### Bun Environment

```typescript
import { SqliteStorage } from "@podley/sqlite/bun";

const storage = new SqliteStorage({
  database: "./data/my-app.db",
});
```

### Auto-Detection

```typescript
import { SqliteStorage } from "@podley/sqlite";

// Automatically detects the environment and uses appropriate implementation
const storage = new SqliteStorage({
  database: "my-app.db",
});
```

## Environment-Specific Features

### Browser

- Uses SQLite WASM for client-side storage
- Supports IndexedDB persistence
- Memory-efficient for large datasets
- Uses `@sqlite.org/sqlite-wasm`

### Node.js

- Uses better-sqlite3 for optimal performance
- Supports file system persistence
- Full SQL feature support
- Uses `better-sqlite3`

### Bun

- Uses Bun's built-in SQLite implementation
- Optimized for Bun's runtime
- Fast startup and execution
- Uses `bun:sqlite`

## License

Licensed under the Apache License, Version 2.0.
