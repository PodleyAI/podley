//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

/**
 * Utility functions for streaming task outputs
 */

/**
 * Converts a string into a stream of chunks
 * @param input The string to stream
 * @param chunkSize The size of each chunk (default: 1 character)
 * @returns An async iterable iterator that yields string chunks
 */
export async function* stringToStream(
  input: string,
  chunkSize: number = 1
): AsyncIterableIterator<string> {
  for (let i = 0; i < input.length; i += chunkSize) {
    yield input.slice(i, i + chunkSize);
  }
}

/**
 * Converts an array into a stream of items
 * @param input The array to stream
 * @returns An async iterable iterator that yields array items
 */
export async function* arrayToStream<T>(input: T[]): AsyncIterableIterator<T> {
  for (const item of input) {
    yield item;
  }
}

/**
 * Converts a progress callback into a stream
 * This is a helper for tasks that use progress callbacks but want to expose streaming
 * @param onProgress The progress callback function
 * @returns An async iterable iterator that yields progress updates
 */
export async function* progressCallbackToStream(
  onProgress: (progress: number, message?: string, details?: any) => void
): AsyncIterableIterator<{ progress: number; message?: string; details?: any }> {
  // This is a placeholder - actual implementation would need to capture progress events
  // For now, this serves as a type definition
  yield { progress: 0 };
}

/**
 * Merges multiple streams into a single stream
 * @param streams Array of async iterable iterators to merge
 * @returns An async iterable iterator that yields items from all streams
 */
export async function* mergeStreams<T>(
  streams: AsyncIterableIterator<T>[]
): AsyncIterableIterator<T> {
  const iterators = streams.map((stream) => stream[Symbol.asyncIterator]());
  const nextPromises = iterators.map((it) => it.next());

  while (nextPromises.length > 0) {
    const results = await Promise.allSettled(nextPromises);
    let hasMore = false;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        const { value, done } = result.value;
        if (!done) {
          yield value;
          nextPromises[i] = iterators[i].next();
          hasMore = true;
        } else {
          nextPromises[i] = Promise.resolve({ value: undefined, done: true });
        }
      } else {
        // Remove failed iterator
        nextPromises.splice(i, 1);
        iterators.splice(i, 1);
        i--;
      }
    }

    if (!hasMore) {
      break;
    }
  }
}
