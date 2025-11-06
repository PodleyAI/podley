# @podley/json-schema Usage Examples

## Example 1: Basic Import and Usage

```typescript
import {
  TextGenerationInputSchema,
  TextGenerationOutputSchema,
  type TextGenerationTaskInput,
  type TextGenerationTaskOutput,
} from "@podley/json-schema";

// Use the TypeScript type for compile-time safety
const input: TextGenerationTaskInput = {
  model: "gpt-3.5-turbo",
  prompt: "Write a haiku about coding",
  maxTokens: 100,
  temperature: 0.7,
};

// The schema object can be used for runtime validation
console.log("Input Schema:", TextGenerationInputSchema);
```

## Example 2: Converting to Standard JSON Schema

```typescript
import { TextGenerationInputSchema } from "@podley/json-schema";

// TypeBox schemas serialize to standard JSON Schema
const jsonSchema = JSON.stringify(TextGenerationInputSchema, null, 2);
console.log(jsonSchema);

// Output:
// {
//   "type": "object",
//   "properties": {
//     "model": { ... },
//     "prompt": { ... },
//     ...
//   },
//   "required": ["model", "prompt"]
// }
```

## Example 3: Runtime Validation with TypeBox

```typescript
import { TextGenerationInputSchema } from "@podley/json-schema";
import { Value } from "@sinclair/typebox/value";

const input = {
  model: "gpt-3.5-turbo",
  prompt: "Hello, world!",
};

// Validate input at runtime
if (Value.Check(TextGenerationInputSchema, input)) {
  console.log("✓ Input is valid");
} else {
  console.log("✗ Input is invalid");
}

// Get validation errors
const errors = [...Value.Errors(TextGenerationInputSchema, input)];
if (errors.length > 0) {
  console.error("Validation errors:", errors);
}
```

## Example 4: Generate OpenAPI/Swagger Documentation

```typescript
import { TextGenerationInputSchema, TextGenerationOutputSchema } from "@podley/json-schema";

// Use schemas in OpenAPI specification
const openApiSpec = {
  openapi: "3.0.0",
  paths: {
    "/generate": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: TextGenerationInputSchema,
            },
          },
        },
        responses: {
          200: {
            content: {
              "application/json": {
                schema: TextGenerationOutputSchema,
              },
            },
          },
        },
      },
    },
  },
};
```

## Example 5: Type-Safe API Client

```typescript
import type {
  TextGenerationTaskInput,
  TextGenerationTaskOutput,
} from "@podley/json-schema";

class PodleyClient {
  async generateText(input: TextGenerationTaskInput): Promise<TextGenerationTaskOutput> {
    // TypeScript ensures type safety
    const response = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.json();
  }
}
```

## Example 6: All Available Schemas

```typescript
import {
  // Text Generation
  TextGenerationInputSchema,
  TextGenerationOutputSchema,
  type TextGenerationTaskInput,
  type TextGenerationTaskOutput,

  // Text Rewriting
  TextRewriterInputSchema,
  TextRewriterOutputSchema,
  type TextRewriterTaskInput,
  type TextRewriterTaskOutput,

  // Text Embedding
  TextEmbeddingInputSchema,
  TextEmbeddingOutputSchema,
  type TextEmbeddingTaskInput,
  type TextEmbeddingTaskOutput,

  // Text Summary
  TextSummaryInputSchema,
  TextSummaryOutputSchema,
  type TextSummaryTaskInput,
  type TextSummaryTaskOutput,

  // Question Answering
  TextQuestionAnswerInputSchema,
  TextQuestionAnswerOutputSchema,
  type TextQuestionAnswerTaskInput,
  type TextQuestionAnswerTaskOutput,

  // Translation
  TextTranslationInputSchema,
  TextTranslationOutputSchema,
  type TextTranslationTaskInput,
  type TextTranslationTaskOutput,

  // Vector Similarity
  VectorSimilarityInputSchema,
  VectorSimilarityOutputSchema,
  type VectorSimilarityTaskInput,
  type VectorSimilarityTaskOutput,

  // Model Download
  DownloadModelInputSchema,
  DownloadModelOutputSchema,
  type DownloadModelTaskRunInput,
  type DownloadModelTaskRunOutput,
} from "@podley/json-schema";
```
