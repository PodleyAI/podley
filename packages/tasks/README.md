# @podley/tasks

A package of task types for common operations, workflow management, and data processing. This package provides building blocks for creating complex task graphs with support for HTTP requests, JavaScript execution, delays, logging, and dynamic task creation.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Available Tasks](#available-tasks)
  - [FetchTask](#fetchtask)
  - [DebugLogTask](#debuglogtask)
  - [DelayTask](#delaytask)
  - [JavaScriptTask](#javascripttask)
  - [LambdaTask](#lambdatask)
  - [JsonTask](#jsontask)
- [Workflow Integration](#workflow-integration)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Testing](#testing)
- [License](#license)

## Installation

```bash
bun add @podley/tasks
```

## Quick Start

```typescript
import { Workflow, Fetch, DebugLog, Delay } from "@podley/tasks";

// Simple workflow example (fluent API)
const workflow = new Workflow()
  .Fetch({ url: "https://api.example.com/data", response_type: "json" })
  .DebugLog({ log_level: "info" })
  .Delay({ delay: 1000 });

const results = await workflow.run();
```

```typescript
import { FetchTask, DebugLogTask, DelayTask } from "@podley/tasks";

// Simple sequence using Task classes directly
const fetchResult = await new FetchTask({
  url: "https://api.example.com/data",
  response_type: "json",
}).run();

await new DebugLogTask({
  console: fetchResult.json,
  log_level: "info",
}).run();

await new DelayTask({ delay: 1000 }).run();
```

```typescript
import { Fetch, DebugLog, Delay } from "@podley/tasks";

const data = await Fetch({
  url: "https://example.com/readme.txt",
  response_type: "text",
});
await DebugLog({
  console: data.text,
  log_level: "info",
});
```

## Available Tasks

### FetchTask

Makes HTTP requests with built-in retry logic, progress tracking, and multiple response types.

**Input Schema:**

- `url` (string, required): The URL to fetch from
- `method` (string, optional): HTTP method ("GET", "POST", "PUT", "DELETE", "PATCH"). Default: "GET"
- `headers` (object, optional): Headers to send with the request
- `body` (string, optional): Request body for POST/PUT requests
- `response_type` (string, optional): Response format ("json", "text", "blob", "arraybuffer"). Default: "json"
- `timeout` (number, optional): Request timeout in milliseconds
- `queueName` (string, optional): Job queue name for rate limiting

**Output Schema:**

- `json` (any, optional): JSON response data
- `text` (string, optional): Text response data
- `blob` (Blob, optional): Blob response data
- `arraybuffer` (ArrayBuffer, optional): ArrayBuffer response data

**Examples:**

```typescript
// Simple GET request
const response = await new FetchTask({
  url: "https://api.example.com/users",
  response_type: "json",
}).run();
console.log(response.json);

// POST request with headers
const postResponse = await new FetchTask({
  url: "https://api.example.com/users",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer token",
  },
  body: JSON.stringify({ name: "John", email: "john@example.com" }),
  response_type: "json",
}).run();

// Text response
const textResponse = await new FetchTask({
  url: "https://example.com/readme.txt",
  response_type: "text",
}).run();
console.log(textResponse.text);
```

**Features:**

- Automatic retry on 429/503 status codes with Retry-After header support (requires creation of a `@podley/job-queue` instance)
- Progress tracking for large downloads
- Request timeout handling
- Queue-based rate limiting (requires creation of a `@podley/job-queue` instance)
- Comprehensive error handling

### DebugLogTask

Provides console logging functionality with multiple log levels for debugging task graphs.

**Input Schema:**

- `console` (any, optional): The message/data to log
- `log_level` (string, optional): Log level ("dir", "log", "debug", "info", "warn", "error"). Default: "log"

**Output Schema:**

- `console` (any): The logged message (passed through)

**Examples:**

```typescript
// Basic logging
await new DebugLogTask({
  console: "Processing user data",
  log_level: "info",
}).run();

// Object inspection with dir
await new DebugLogTask({
  console: { user: { id: 1, name: "John" }, status: "active" },
  log_level: "dir",
}).run();

// In workflow with data flow
const workflow = new Workflow()
  .Fetch({ url: "https://api.example.com/data" })
  .DebugLog({ log_level: "dir" }) // Logs the fetched data
  .Delay({ delay: 1000 });
```

**Features:**

- Multiple log levels for different debugging needs
- Deep object inspection with `dir` level
- Pass-through functionality preserves data flow
- Non-cacheable for real-time debugging

### DelayTask

Introduces timed delays in workflows with progress tracking and cancellation support.

**Input Schema:**

- `delay` (number, optional): Delay duration in milliseconds. Default: 1
- `pass_through` (any, optional): Data to pass through to the output

**Output Schema:**

- Returns the `pass_through` data unchanged

**Examples:**

```typescript
// Simple delay
await Delay({ delay: 5000 }); // 5 second delay

// Delay with data pass-through
const result = await new DelayTask({
  delay: 3000,
  pass_through: { message: "Data preserved through delay" },
}).run();
console.log(result); // { message: "Data preserved through delay" }

// In workflow
const workflow = new Workflow()
  .Fetch({ url: "https://api.example.com/data" })
  .Delay({ delay: 2000 }) // 2 second delay
  .DebugLog({ log_level: "info" });
```

**Features:**

- Progress tracking for delays over 100ms
- Cancellation support via AbortSignal
- Chunked delay execution for responsiveness
- Data pass-through capability

### JavaScriptTask

Executes JavaScript code strings using a safe interpreter with input/output handling.

**Input Schema:**

- `code` (string, required): JavaScript code to execute
- `input` (any, optional): Input data available to the code

**Output Schema:**

- `output` (any): The result of the JavaScript execution

**Examples:**

```typescript
// Simple calculation
const result = await JavaScript({
  code: "2 + 3 * 4",
});
console.log(result.output); // 14

// Using input data
const processed = await new JavaScriptTask({
  code: `
    const numbers = input.values;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const average = sum / numbers.length;
    return { sum, average, count: numbers.length };
  `,
  input: { values: [1, 2, 3, 4, 5] },
}).run();
console.log(processed.output); // { sum: 15, average: 3, count: 5 }

// In workflow
const workflow = new Workflow()
  .Fetch({ url: "https://api.example.com/data" })
  .JavaScript({
    code: `
      const data = input.json;
      return data.filter(item => item.active === true);
    `,
  })
  .DebugLog({ log_level: "info" });
```

**Features:**

- Safe JavaScript execution using interpreter
- Access to input data within code
- Error handling and logging
- Suitable for data transformation and filtering

### LambdaTask

Executes custom JavaScript functions with full access to task context and configuration.

**Input Schema:**

- Accepts any input data (flexible schema)

**Output Schema:**

- Returns whatever the provided function outputs

**Configuration:**

- `execute`: Function for standard execution
- `executeReactive`: Function for reactive execution with output parameter

**Examples:**

```typescript
// Function with execute pattern
const result = await Lambda(
  { numbers: [1, 2, 3, 4, 5] },
  {
    execute: async (input, context) => {
      const sum = input.numbers.reduce((a, b) => a + b, 0);
      await context.updateProgress(50, "Calculating sum");
      const average = sum / input.numbers.length;
      await context.updateProgress(100, "Complete");
      return { sum, average };
    },
  }
);

// Reactive pattern with output parameter
const reactiveResult = await new LambdaTask(
  { message: "Hello" },
  {
    executeReactive: async (input, output, context) => {
      output.processed = input.message.toUpperCase();
      output.timestamp = new Date().toISOString();
      return output;
    },
  }
).run();

// Data transformation function
const transformer = await new LambdaTask(
  {
    data: [
      { name: "John", age: 30 },
      { name: "Jane", age: 25 },
    ],
  },
  {
    execute: async (input) => {
      return {
        users: input.data.map((user) => ({
          ...user,
          isAdult: user.age >= 18,
          category: user.age < 30 ? "young" : "mature",
        })),
      };
    },
  }
).run();

// Async operation with external API
const apiProcessor = await new LambdaTask(
  { userId: 123 },
  {
    execute: async (input, context) => {
      await context.updateProgress(25, "Fetching user data");
      const userData = await fetch(`/api/users/${input.userId}`).then((r) => r.json());

      await context.updateProgress(75, "Processing data");
      const enrichedData = {
        ...userData,
        processedAt: new Date().toISOString(),
        isActive: userData.lastLogin > Date.now() - 86400000, // 24 hours
      };

      await context.updateProgress(100, "Complete");
      return enrichedData;
    },
  }
).run();
```

**Features:**

- Full access to execution context and progress tracking
- Support for both standard and reactive execution patterns
- Async/await support
- Flexible input/output schemas
- Cacheable by default

### JsonTask

Creates and executes task graphs from JSON configurations, enabling dynamic workflow creation.

**Input Schema:**

- `json` (string, required): JSON string defining tasks and their dependencies

**Output Schema:**

- `output` (any): Output depends on the generated task graph

**JSON Format:**

```typescript
interface JsonTaskItem {
  id: string; // Unique task identifier
  type: string; // Task type (e.g., "FetchTask", "DelayTask")
  input?: any; // Task input data
  config?: any; // Task configuration
  dependencies?: {
    // Input dependencies from other tasks
    [inputField: string]:
      | {
          id: string; // Source task ID
          output: string; // Output field from source task
        }
      | Array<{ id: string; output: string }>;
  };
}
```

**Examples:**

```typescript
// Simple linear workflow
const linearWorkflow = await new JsonTask({
  json: JSON.stringify([
    {
      id: "fetch-data",
      type: "FetchTask",
      input: {
        url: "https://api.example.com/users",
        response_type: "json",
      },
    },
    {
      id: "log-data",
      type: "DebugLogTask",
      input: {
        log_level: "info",
      },
      dependencies: {
        console: { id: "fetch-data", output: "json" },
      },
    },
    {
      id: "delay",
      type: "DelayTask",
      input: { delay: 1000 },
    },
  ]),
}).run();

// Complex workflow with data dependencies
const complexWorkflow = await new JsonTask({
  json: JSON.stringify([
    {
      id: "fetch-users",
      type: "FetchTask",
      input: {
        url: "https://api.example.com/users",
        response_type: "json",
      },
    },
    {
      id: "fetch-posts",
      type: "FetchTask",
      input: {
        url: "https://api.example.com/posts",
        response_type: "json",
      },
    },
    {
      id: "combine-data",
      type: "JavaScriptTask",
      input: {
        code: `
          const users = input.users;
          const posts = input.posts;
          return users.map(user => ({
            ...user,
            posts: posts.filter(post => post.userId === user.id)
          }));
        `,
      },
      dependencies: {
        input: [
          { id: "fetch-users", output: "json" },
          { id: "fetch-posts", output: "json" },
        ],
      },
    },
    {
      id: "log-result",
      type: "DebugLogTask",
      input: { log_level: "dir" },
      dependencies: {
        console: { id: "combine-data", output: "output" },
      },
    },
  ]),
}).run();

// Dynamic task creation from external config
const configResponse = await fetch("/api/workflow-config");
const workflowConfig = await configResponse.json();

const dynamicWorkflow = await new JsonTask({
  json: JSON.stringify(workflowConfig.tasks),
}).run();
```

**Features:**

- Dynamic task graph creation from JSON
- Support for complex dependency relationships
- All registered task types are available
- Automatic data flow between tasks
- Enables configuration-driven workflows

## Workflow Integration

All tasks can be used standalone or integrated into workflows:

```typescript
import { Workflow } from "@podley/tasks";

// Fluent workflow API
const workflow = new Workflow()
  .Fetch({
    url: "https://api.example.com/data",
    response_type: "json",
  })
  .JavaScript({
    code: "return input.json.filter(item => item.status === 'active');",
  })
  .DebugLog({ log_level: "info" })
  .Delay({ delay: 500 })
  .Lambda(
    {},
    {
      execute: async (input) => ({
        processed: true,
        count: input.output.length,
        timestamp: new Date().toISOString(),
      }),
    }
  );

const result = await workflow.run();
```

## Error Handling

Tasks include comprehensive error handling:

```typescript
try {
  const result = await new FetchTask({
    url: "https://api.example.com/data",
    response_type: "json",
    timeout: 5000,
  }).run();
} catch (error) {
  if (error instanceof TaskInvalidInputError) {
    console.error("Invalid input:", error.message);
  } else if (error instanceof RetryableJobError) {
    console.error("Retryable error:", error.message);
    // Will be retried automatically
  } else if (error instanceof PermanentJobError) {
    console.error("Permanent error:", error.message);
    // Will not be retried
  }
}
```

## Configuration

Tasks support various configuration options:

```typescript
// Task-specific configuration
const fetchTask = new FetchTask(
  {
    url: "https://api.example.com/data",
  },
  {
    queueName: "api-requests",
    timeout: 10000,
    retryAttempts: 3,
  }
);

// Global workflow configuration
const workflow = new Workflow({
  maxConcurrency: 5,
  timeout: 30000,
});
```

## Testing

```bash
bun test
```

## License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
