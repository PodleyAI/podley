# @podley/tasks

A package for building and running DAG pipelines of AI tasks. Provides various task types for common operations and workflow management.

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Available Tasks](#available-tasks)
  - [Core Tasks](#core-tasks)
  - [I/O Operations](#io-operations)
  - [Utilities](#utilities)
- [Testing](#testing)
- [License](#license)

## Features

**Task Types:**

- **Core Tasks**: JavaScript execution, Lambda functions, JSON-based task graphs
- **I/O Operations**: HTTP requests (Fetch), debugging/logging
- **Utilities**: Delays

## Installation

```bash
bun add @podley/tasks
```

## Basic Usage

```typescript
import { Workflow, Fetch, DebugLog, Delay } from "@podley/tasks";

const workflow = new Workflow()
  .Fetch({ url: "https://api.example.com/data" })
  .DebugLog({ level: "dir" })
  .Delay({ delay: 1000 });

const results = await workflow.run();
```

## Available Tasks

### Core Tasks

- **`JavaScriptTask`** - Interpreter based JavaScript code (as strings) snippet execution
- **`LambdaTask`** - Create custom functions with runtime configuration
- **`JsonTask`** - Build workflows from JSON definitions

### I/O Operations

- **`FetchTask`** - Make HTTP requests with retry/rate limiting
- **`DebugLogTask`** - Configurable logging for pipeline debugging

### Utilities

- **`DelayTask`** - Add timed delays in workflows

## Testing

```bash
bun test
```

## License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.
