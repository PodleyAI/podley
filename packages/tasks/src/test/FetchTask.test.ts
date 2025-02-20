//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, test, expect, beforeEach, afterEach, mock, beforeAll, afterAll } from "bun:test";
import { Fetch, FetchJob } from "../task/FetchTask";
import {
  getTaskQueueRegistry,
  setTaskQueueRegistry,
  TaskInput,
  TaskOutput,
} from "@ellmers/task-graph";
import { InMemoryJobQueue, InMemoryRateLimiter } from "@ellmers/job-queue";
import { sleep } from "@ellmers/util";

// Create base mock response
const createMockResponse = (jsonData: any = {}): Response => {
  return new Response(JSON.stringify(jsonData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Mock fetch for testing
const mockFetch = mock((input: RequestInfo | URL, init?: RequestInit) =>
  Promise.resolve(createMockResponse({}))
);

const oldFetch = global.fetch;

describe("FetchTask", () => {
  beforeAll(() => {
    (global as any).fetch = mockFetch;
  });

  afterAll(() => {
    (global as any).fetch = oldFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
    setTaskQueueRegistry(null);
  });

  afterEach(() => {
    setTaskQueueRegistry(null);
  });

  test("fetches multiple URLs successfully", async () => {
    const mockResponses = [
      { data: { id: 1, name: "Test 1" } },
      { data: { id: 2, name: "Test 2" } },
      { data: { id: 3, name: "Test 3" } },
    ];

    let responseIndex = 0;
    mockFetch.mockImplementation(() =>
      Promise.resolve(createMockResponse(mockResponses[responseIndex++]))
    );

    const urls = [
      "https://api.example.com/1",
      "https://api.example.com/2",
      "https://api.example.com/3",
    ];

    const results = await Promise.all(
      urls.map((url) =>
        Fetch({
          url,
        })
      )
    );

    expect(mockFetch.mock.calls.length).toBe(3);
    expect(results).toHaveLength(3);
    expect(results[0].output).toEqual({ data: { id: 1, name: "Test 1" } });
    expect(results[1].output).toEqual({ data: { id: 2, name: "Test 2" } });
    expect(results[2].output).toEqual({ data: { id: 3, name: "Test 3" } });
  });

  test("respects rate limiting with InMemoryQueue", async () => {
    const queueName = "rate-limited-queue";
    // Create a rate limiter that allows 1 request per minute
    const rateLimiter = new InMemoryRateLimiter(1, 1); // 1 request per 1 minute window

    // Create a queue with the base Job type to match TaskQueueRegistry's expectations
    const queue = new InMemoryJobQueue<TaskInput, TaskOutput>(queueName, FetchJob, {
      limiter: rateLimiter,
      waitDurationInMilliseconds: 1,
    });

    // Register the queue with the registry
    getTaskQueueRegistry().registerQueue(queue);

    const mockResponse = { data: { success: true } };
    mockFetch.mockImplementation(() => Promise.resolve(createMockResponse(mockResponse)));

    // Add jobs to queue
    await queue.add(new FetchJob({ input: { url: "https://api.example.com/1" } }));
    await queue.add(new FetchJob({ input: { url: "https://api.example.com/2" } }));
    await queue.add(new FetchJob({ input: { url: "https://api.example.com/3" } }));

    // Start the queue and wait for processing
    await queue.start();
    await sleep(1); // Give time for rate limiting and processing

    // Verify that fetch was called only once due to rate limiting
    expect(mockFetch.mock.calls.length).toBe(1);

    // Clean up
    await queue.stop();
    await queue.clear();
  });
});
