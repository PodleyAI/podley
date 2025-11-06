# @podley/json-schema

JSON Schema definitions and TypeScript types for all Podley task input and output schemas.

## Overview

This package provides a centralized location for all JSON Schema definitions and TypeScript types used by Podley AI tasks. Each schema is exported in two forms:

1. **TypeBox Schema Object** - A runtime schema object that can be used for validation and can be converted to JSON Schema
2. **TypeScript Type** - A compile-time type definition derived from the schema

## Installation

```bash
npm install @podley/json-schema
```

or with bun:

```bash
bun add @podley/json-schema
```

## Usage

### Importing Schemas

```typescript
import {
  TextGenerationInputSchema,
  TextGenerationOutputSchema,
  type TextGenerationTaskInput,
  type TextGenerationTaskOutput,
} from "@podley/json-schema";
```

### Using Schema Objects

The schema objects are TypeBox schemas that can be used for runtime validation:

```typescript
import { TextGenerationInputSchema } from "@podley/json-schema";
import { Value } from "@sinclair/typebox/value";

const input = {
  model: "gpt-3.5-turbo",
  prompt: "Hello, world!",
};

// Validate input
const isValid = Value.Check(TextGenerationInputSchema, input);
console.log(isValid); // true or false
```

### Converting to JSON Schema

TypeBox schemas can be easily converted to standard JSON Schema format:

```typescript
import { TextGenerationInputSchema } from "@podley/json-schema";

const jsonSchema = JSON.stringify(TextGenerationInputSchema, null, 2);
console.log(jsonSchema);
```

Output:
```json
{
  "type": "object",
  "properties": {
    "model": { ... },
    "prompt": { ... },
    "maxTokens": { ... },
    ...
  },
  "required": ["model", "prompt"]
}
```

### Using TypeScript Types

The TypeScript types provide compile-time type safety:

```typescript
import type { TextGenerationTaskInput } from "@podley/json-schema";

function generateText(input: TextGenerationTaskInput) {
  // TypeScript will ensure input has the correct shape
  console.log(input.model, input.prompt);
}
```

## Available Schemas

### Text Processing Tasks

- **TextGeneration** - Text generation using language models
  - `TextGenerationInputSchema` / `TextGenerationTaskInput`
  - `TextGenerationOutputSchema` / `TextGenerationTaskOutput`

- **TextRewriter** - Text rewriting based on prompts
  - `TextRewriterInputSchema` / `TextRewriterTaskInput`
  - `TextRewriterOutputSchema` / `TextRewriterTaskOutput`

- **TextSummary** - Text summarization
  - `TextSummaryInputSchema` / `TextSummaryTaskInput`
  - `TextSummaryOutputSchema` / `TextSummaryTaskOutput`

- **TextQuestionAnswer** - Question answering
  - `TextQuestionAnswerInputSchema` / `TextQuestionAnswerTaskInput`
  - `TextQuestionAnswerOutputSchema` / `TextQuestionAnswerTaskOutput`

- **TextTranslation** - Text translation
  - `TextTranslationInputSchema` / `TextTranslationTaskInput`
  - `TextTranslationOutputSchema` / `TextTranslationTaskOutput`

### Embedding Tasks

- **TextEmbedding** - Generate vector embeddings for text
  - `TextEmbeddingInputSchema` / `TextEmbeddingTaskInput`
  - `TextEmbeddingOutputSchema` / `TextEmbeddingTaskOutput`

### Vector Tasks

- **VectorSimilarity** - Compare vectors using similarity functions
  - `VectorSimilarityInputSchema` / `VectorSimilarityTaskInput`
  - `VectorSimilarityOutputSchema` / `VectorSimilarityTaskOutput`

### Utility Tasks

- **DownloadModel** - Download and cache AI models
  - `DownloadModelInputSchema` / `DownloadModelTaskRunInput`
  - `DownloadModelOutputSchema` / `DownloadModelTaskRunOutput`

## License

Apache License 2.0 - Copyright Steven Roussey
