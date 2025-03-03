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
import { JobQueue, InMemoryRateLimiter } from "@ellmers/job-queue";
import { sleep } from "@ellmers/util";
import { PermanentJobError, RetryableJobError } from "@ellmers/job-queue";

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

    const results = await Promise.all(urls.map((url) => Fetch({ url })));

    expect(mockFetch.mock.calls.length).toBe(3);
    expect(results).toHaveLength(3);
    expect(results[0].body).toEqual({ data: { id: 1, name: "Test 1" } });
    expect(results[1].body).toEqual({ data: { id: 2, name: "Test 2" } });
    expect(results[2].body).toEqual({ data: { id: 3, name: "Test 3" } });
  });

  test("respects rate limiting with InMemoryQueue", async () => {
    const queueName = "rate-limited-queue";
    // Create a rate limiter that allows 1 request per minute
    const rateLimiter = new InMemoryRateLimiter(1, 1); // 1 request per 1 minute window

    // Create a queue with the base Job type to match TaskQueueRegistry's expectations
    const queue = new JobQueue<TaskInput, TaskOutput>(queueName, FetchJob, {
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

  test("handles HTTP error responses", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Not Found", {
          status: 404,
          statusText: "Not Found",
        })
      )
    );

    const fetchPromise = Fetch({
      url: "https://api.example.com/notfound",
    });

    expect(fetchPromise).rejects.toThrow();
    expect(fetchPromise).rejects.toBeInstanceOf(PermanentJobError);
    expect(fetchPromise).rejects.toHaveProperty("message", expect.stringContaining("404"));

    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles network errors", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("Network error")));

    const fetchPromise = Fetch({
      url: "https://api.example.com/network-error",
    });

    expect(fetchPromise).rejects.toThrow("Network error");
    expect(fetchPromise).rejects.toBeInstanceOf(Error);

    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles invalid JSON responses", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Invalid JSON", {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
    );

    const fetchPromise = Fetch({
      url: "https://api.example.com/invalid-json",
    });

    expect(fetchPromise).rejects.toThrow();
    expect(fetchPromise).rejects.toHaveProperty("message", expect.stringContaining("JSON"));

    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles mixed success and failure responses", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(createMockResponse({ data: "success" }));
      } else if (callCount === 2) {
        return Promise.reject(new Error("Network error"));
      } else {
        return Promise.resolve(
          new Response("Not Found", {
            status: 404,
            statusText: "Not Found",
          })
        );
      }
    });

    const urls = [
      "https://api.example.com/success",
      "https://api.example.com/network-error",
      "https://api.example.com/not-found",
    ];

    const results = await Promise.allSettled(
      urls.map((url) =>
        Fetch({
          url,
        })
      )
    );

    expect(mockFetch.mock.calls.length).toBe(3);
    expect(results[0].status).toBe("fulfilled");
    expect((results[0] as PromiseFulfilledResult<any>).value.body).toEqual({ data: "success" });
    expect(results[1].status).toBe("rejected");
    expect((results[1] as PromiseRejectedResult).reason.message).toBe("Network error");
    expect(results[2].status).toBe("rejected");
    expect((results[2] as PromiseRejectedResult).reason).toBeInstanceOf(PermanentJobError);
    expect((results[2] as PromiseRejectedResult).reason.message).toContain("404");
  });

  test("handles rate limit responses with Retry-After header as seconds", async () => {
    const retryAfterSeconds = 30;
    const beforeTest = Date.now();
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Too Many Requests", {
          status: 429,
          statusText: "Too Many Requests",
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
          },
        })
      )
    );

    const error = await Fetch({
      url: "https://api.example.com/rate-limited",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(RetryableJobError);
    expect(error.message).toContain("429");
    expect(error.retryDate).toBeInstanceOf(Date);

    // Should be approximately retryAfterSeconds in the future
    const expectedTime = beforeTest + retryAfterSeconds * 1000;
    const actualTime = error.retryDate.getTime();
    const tolerance = 1000; // 1 second tolerance

    expect(actualTime).toBeGreaterThan(expectedTime - tolerance);
    expect(actualTime).toBeLessThan(expectedTime + tolerance);
    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles service unavailable with default retry time", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Service Unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        })
      )
    );

    const error = await Fetch({
      url: "https://api.example.com/service-unavailable",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(RetryableJobError);
    expect(error.message).toContain("503");

    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles Retry-After with HTTP date format", async () => {
    const retryDate = new Date(Date.now() + 60000); // 1 minute in the future
    const retryDateStr = retryDate.toUTCString();
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Too Many Requests", {
          status: 429,
          statusText: "Too Many Requests",
          headers: {
            "retry-after": retryDateStr,
          },
        })
      )
    );

    const error = await Fetch({
      url: "https://api.example.com/rate-limited-date",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(RetryableJobError);
    expect(error.message).toContain("429");
    expect(error.retryDate).toBeInstanceOf(Date);
    expect(error.retryDate > new Date()).toBe(true); // Should be in the future

    // Should be close to our specified retry date
    const timeDiff = Math.abs(error.retryDate.getTime() - retryDate.getTime());
    expect(timeDiff).toBeLessThan(1000); // Within 1 second
    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles invalid Retry-After date by falling back to seconds", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Too Many Requests", {
          status: 429,
          statusText: "Too Many Requests",
          headers: {
            "Retry-After": "invalid-date",
          },
        })
      )
    );

    const beforeTest = Date.now();
    const error = await Fetch({
      url: "https://api.example.com/rate-limited-invalid",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(RetryableJobError);
    expect(error.message).toContain("429");
    expect(error.retryDate).not.toBeInstanceOf(Date);
    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles past Retry-After in the past", async () => {
    const pastDate = new Date(Date.now() - 60000); // 1 minute in the past
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Too Many Requests", {
          status: 429,
          statusText: "Too Many Requests",
          headers: {
            "Retry-After": pastDate.toUTCString(),
          },
        })
      )
    );

    const error = await Fetch({
      url: "https://api.example.com/rate-limited-past",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(RetryableJobError);
    expect(error.message).toContain("429");
    expect(error.retryDate).not.toBeInstanceOf(Date);
    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles Retry-After with RFC1123 date format", async () => {
    const retryDate = new Date(Date.now() + 120000); // 2 minutes in the future
    const retryDateStr = retryDate.toUTCString(); // RFC1123 format
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Too Many Requests", {
          status: 429,
          statusText: "Too Many Requests",
          headers: {
            "Retry-After": retryDateStr,
          },
        })
      )
    );

    const error = await Fetch({
      url: "https://api.example.com/rate-limited-rfc1123",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(RetryableJobError);
    expect(error.message).toContain("429");
    expect(error.retryDate).toBeInstanceOf(Date);

    // Should be very close to the date we provided (within 1 second)
    const tolerance = 1000;
    expect(Math.abs(error.retryDate.getTime() - retryDate.getTime())).toBeLessThan(tolerance);
    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("handles Retry-After with ISO8601 date format", async () => {
    const retryDate = new Date(Date.now() + 180000); // 3 minutes in the future
    const retryDateStr = retryDate.toISOString(); // ISO8601 format
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        new Response("Too Many Requests", {
          status: 429,
          statusText: "Too Many Requests",
          headers: {
            "Retry-After": retryDateStr,
          },
        })
      )
    );

    const error = await Fetch({
      url: "https://api.example.com/rate-limited-iso8601",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(RetryableJobError);
    expect(error.message).toContain("429");
    expect(error.retryDate).toBeInstanceOf(Date);

    // Should be very close to the date we provided (within 1 second)
    const tolerance = 1000;
    expect(Math.abs(error.retryDate.getTime() - retryDate.getTime())).toBeLessThan(tolerance);
    expect(mockFetch.mock.calls.length).toBe(1);
  });
});
