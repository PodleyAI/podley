//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { DataPortSchema } from "./TaskSchema";

/**
 * Describes a streaming-compatible value exposed by a task.
 * Tasks may either yield values through AsyncIterables or ReadableStreams.
 */
export type TaskStream<TChunk = unknown> = AsyncIterable<TChunk> | ReadableStream<TChunk>;

/**
 * Defines when a downstream consumer can begin execution relative to a streaming output.
 * - `first-chunk`: consumers may start when the first chunk is available.
 * - `final`: consumers must wait for the stream to finish.
 */
export type TaskStreamReadiness = "first-chunk" | "final";

/**
 * Aggregator used to project a stream of chunks into a final output value.
 * Implementations must be pure; they receive the current aggregate state for every chunk
 * and are expected to return a new state instance.
 */
export interface TaskStreamAccumulator<Chunk, Aggregate> {
  readonly initial: () => Aggregate;
  readonly accumulate: (current: Aggregate, chunk: Chunk) => Aggregate;
  readonly complete: (current: Aggregate) => Aggregate;
}

/**
 * Metadata describing how a specific output port behaves when streaming.
 */
export interface TaskStreamPortDescriptor<Chunk = unknown, Aggregate = unknown> {
  readonly chunkSchema: DataPortSchema | null;
  readonly readiness: TaskStreamReadiness;
  readonly accumulator: TaskStreamAccumulator<Chunk, Aggregate>;
}

/**
 * Metadata describing all stream-capable outputs for a task.
 */
export interface TaskStreamingDescriptor {
  readonly outputs: Readonly<Record<string, TaskStreamPortDescriptor<any, any>>>;
}

/**
 * Type guard for ReadableStream values.
 */
export function isReadableStream<TChunk = unknown>(
  value: unknown
): value is ReadableStream<TChunk> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { getReader?: unknown }).getReader === "function"
  );
}

/**
 * Type guard for AsyncIterable values.
 */
export function isAsyncIterable<TChunk = unknown>(value: unknown): value is AsyncIterable<TChunk> {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === "function"
  );
}

/**
 * Type guard that matches either ReadableStream or AsyncIterable values.
 */
export function isTaskStream<TChunk = unknown>(value: unknown): value is TaskStream<TChunk> {
  return isReadableStream<TChunk>(value) || isAsyncIterable<TChunk>(value);
}

/**
 * Converts a ReadableStream into an AsyncIterableIterator.
 */
export async function* readableStreamToAsyncIterable<TChunk>(
  stream: ReadableStream<TChunk>
): AsyncIterableIterator<TChunk> {
  const reader = stream.getReader();
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        return;
      }
      yield result.value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Ensures a streaming value exposes the AsyncIterable protocol.
 */
export function toAsyncIterable<TChunk>(stream: TaskStream<TChunk>): AsyncIterableIterator<TChunk> {
  if (isAsyncIterable<TChunk>(stream)) {
    return (async function* iterate() {
      for await (const chunk of stream) {
        yield chunk;
      }
    })();
  }
  return readableStreamToAsyncIterable(stream);
}

/**
 * Creates a simple accumulator that collects stream chunks into an array.
 */
export function createArrayAccumulator<Chunk>(): TaskStreamAccumulator<Chunk, Chunk[]> {
  return {
    initial: () => [],
    accumulate: (current, chunk) => [...current, chunk],
    complete: (current) => current,
  };
}

/**
 * Creates an accumulator that concatenates string chunks.
 */
export function createStringAccumulator(): TaskStreamAccumulator<string, string> {
  return {
    initial: () => "",
    accumulate: (current, chunk) => `${current}${chunk}`,
    complete: (current) => current,
  };
}

/**
 * Creates an accumulator that always retains the most recent chunk.
 */
export function createLatestValueAccumulator<Chunk>(): TaskStreamAccumulator<Chunk, Chunk | null> {
  return {
    initial: () => null,
    accumulate: (_, chunk) => chunk,
    complete: (current) => current,
  };
}
