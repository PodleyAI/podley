# Array Tasks

This document describes the ArraySplitTask and ArrayMergeTask utilities for working with arrays in Workglow workflows.

## ArraySplitTask

Takes an array or single value as input and creates separate outputs for each element. Each output is named by its index (output_0, output_1, output_2, etc.).

### Features
- Accepts both arrays and single values as input
- Creates one output per array element
- Single values are treated as a single-element array
- Output count matches array length
- Useful for known array sizes where you want to process elements in parallel

### Usage

```typescript
import { ArraySplit } from "@workglow/tasks";

// Split an array into individual outputs
const result = await ArraySplit({
  input: [1, 2, 3, 4, 5],
});
// Result: { output_0: 1, output_1: 2, output_2: 3, output_3: 4, output_4: 5 }

// Single value
const result2 = await ArraySplit({
  input: "hello",
});
// Result: { output_0: "hello" }
```

### Input Schema
```typescript
{
  input: any | any[] // Can be a single value or an array
}
```

### Output Schema
```typescript
{
  output_0?: any,
  output_1?: any,
  output_2?: any,
  // ... dynamic based on input array length
}
```

## ArrayMergeTask

Takes multiple inputs and merges them into a single array output. Input properties are collected and sorted by key name to create a deterministic output order.

### Features
- Accepts any number of input properties (additionalProperties: true)
- Merges all input values into a single array output
- Sorts inputs by property name for consistent ordering
- Output is always an array
- Useful for collecting results from parallel branches

### Usage

```typescript
import { ArrayMerge } from "@workglow/tasks";

// Merge multiple inputs into an array
const result = await ArrayMerge({
  input_0: "a",
  input_1: "b",
  input_2: "c",
});
// Result: { output: ["a", "b", "c"] }

// Keys are sorted for deterministic ordering
const result2 = await ArrayMerge({
  z: "last",
  a: "first",
  m: "middle",
});
// Result: { output: ["first", "middle", "last"] }
```

### Input Schema
```typescript
{
  [key: string]: any // Any number of inputs
}
```

### Output Schema
```typescript
{
  output: any[] // Merged array of all input values
}
```

## Example: Split and Merge Pattern

You can combine these tasks to process array elements in parallel and collect results:

```typescript
import { Workflow } from "@workglow/task-graph";
import { ArraySplit, ArrayMerge } from "@workglow/tasks";

const workflow = new Workflow();

// Split an array
workflow.ArraySplit({ input: [1, 2, 3, 4, 5] });

// Process each element (e.g., with LambdaTask or other tasks)
// ... your processing logic here ...

// Merge results back into an array
workflow.ArrayMerge({
  input_0: processedValue1,
  input_1: processedValue2,
  input_2: processedValue3,
});

const result = await workflow.run();
```
