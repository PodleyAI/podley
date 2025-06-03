//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import {
  AiJob,
  AiProviderInput,
  AiProviderRegistry,
  getAiProviderRegistry,
  getGlobalModelRepository,
  Model,
  setAiProviderRegistry,
} from "@podley/ai";
import { InMemoryRateLimiter, JobQueue } from "@podley/job-queue";
import { InMemoryQueueStorage } from "@podley/storage";
import {
  TaskInput,
  TaskOutput,
  TaskQueueRegistry,
  getTaskQueueRegistry,
  setTaskQueueRegistry,
} from "@podley/task-graph";
import { sleep } from "@podley/util";
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
// Constants for testing
const TEST_PROVIDER = "test-provider";

describe("AiProviderRegistry", () => {
  // Create a mock run function that reports progress
  const mockLongRunningRunFn = async (job: AiJob, input: TaskInput) => {
    const jobQueue = job.queue!;
    await jobQueue.updateProgress(job.id, 25, "25% complete");
    await sleep(0);
    await jobQueue.updateProgress(job.id, 50, "50% complete");
    await sleep(0);
    await jobQueue.updateProgress(job.id, 75, "75% complete");
    await sleep(0);
    await jobQueue.updateProgress(job.id, 100, "100% complete");
    return { result: "success with progress" };
  };

  let queue: JobQueue<AiProviderInput<TaskInput>, TaskOutput>;
  let aiProviderRegistry: AiProviderRegistry;

  beforeEach(() => {
    queue = new JobQueue(TEST_PROVIDER, AiJob<TaskInput, TaskOutput>, {
      limiter: new InMemoryRateLimiter({ maxExecutions: 4, windowSizeInSeconds: 1 }),
      storage: new InMemoryQueueStorage<AiProviderInput<TaskInput>, TaskOutput>(TEST_PROVIDER),
      waitDurationInMilliseconds: 1,
    });
    setTaskQueueRegistry(new TaskQueueRegistry());
    const taskQueueRegistry = getTaskQueueRegistry();
    taskQueueRegistry.registerQueue(queue);
    setAiProviderRegistry(new AiProviderRegistry()); // Ensure we're using the test registry
    aiProviderRegistry = getAiProviderRegistry();
    queue.start(); // Clear the queue before each test
  });

  afterEach(async () => {
    await queue.stop();
    await queue.clear();
  });
  afterAll(async () => {
    getTaskQueueRegistry().stopQueues().clearQueues();
    setTaskQueueRegistry(null);
  });

  describe("registerRunFn", () => {
    test("should register a run function for a task type and model provider", () => {
      const mockRunFn = mock(() => Promise.resolve({ success: true }));
      aiProviderRegistry.registerRunFn(TEST_PROVIDER, "text-generation", mockRunFn);

      expect(aiProviderRegistry.runFnRegistry["text-generation"][TEST_PROVIDER]).toBe(mockRunFn);
    });

    test("should create task type object if it does not exist", () => {
      const mockRunFn = mock(() => Promise.resolve({ success: true }));
      aiProviderRegistry.registerRunFn(TEST_PROVIDER, "new-task", mockRunFn);

      expect(aiProviderRegistry.runFnRegistry["new-task"]).toBeDefined();
      expect(aiProviderRegistry.runFnRegistry["new-task"][TEST_PROVIDER]).toBe(mockRunFn);
    });
  });

  describe("getDirectRunFn", () => {
    test("should return registered run function", () => {
      const mockRunFn = mock(() => Promise.resolve({ success: true }));
      aiProviderRegistry.registerRunFn(TEST_PROVIDER, "text-generation", mockRunFn);

      const retrievedFn = aiProviderRegistry.getDirectRunFn(TEST_PROVIDER, "text-generation");
      expect(retrievedFn).toBe(mockRunFn);
    });

    test("should throw error for unregistered task type", () => {
      expect(() => {
        aiProviderRegistry.getDirectRunFn(TEST_PROVIDER, "nonexistent");
      }).toThrow(
        "No run function found for task type nonexistent and model provider test-provider"
      );
    });
  });

  describe("jobAsTaskRunFn", () => {
    test("should create a job wrapper and queue it", async () => {
      const mockRunFn = mock(() => Promise.resolve({ result: "success" }));
      aiProviderRegistry.registerRunFn(TEST_PROVIDER, "text-generation", mockRunFn);
      const mockTask = {
        config: {
          runnerId: undefined as string | undefined,
          queue: undefined as string | undefined,
          currentJobId: undefined as string | undefined,
        },
      };
      const wrappedFn = aiProviderRegistry.getDirectRunFn(TEST_PROVIDER, "text-generation");
      const result = await wrappedFn(
        { text: "test input" },
        undefined,
        () => {},
        new AbortController().signal
      );
      expect(result).toEqual({ result: "success" });
      expect(mockRunFn).toHaveBeenCalled();
    });
  });

  describe("singleton management", () => {
    test("should maintain a singleton instance", () => {
      const instance1 = getAiProviderRegistry();
      const instance2 = getAiProviderRegistry();
      expect(instance1).toBe(instance2);
    });

    test("should allow setting a new registry instance", () => {
      const newRegistry = new AiProviderRegistry();
      setAiProviderRegistry(newRegistry);
      expect(getAiProviderRegistry()).toBe(newRegistry);
    });
  });

  describe("AiJob", () => {
    test("should execute registered function with correct parameters", async () => {
      const mockRunFn = mock((...args) => {
        return Promise.resolve({ result: "success" });
      });

      aiProviderRegistry.registerRunFn(TEST_PROVIDER, "text-generation", mockRunFn);
      const model = await getGlobalModelRepository().addModel({
        name: "test-model",
        provider: TEST_PROVIDER,
        url: "test-model",
        availableOnBrowser: true,
        availableOnServer: true,
        pipeline: "text-generation",
      });

      const controller = new AbortController();
      const job = new AiJob({
        queueName: TEST_PROVIDER,
        input: {
          aiProvider: TEST_PROVIDER,
          taskType: "text-generation",
          taskInput: { text: "test", model: "test-model" },
        },
      });

      const result = await job.execute(job.input, {
        signal: controller.signal,
        updateProgress: () => {},
      });

      expect(result).toEqual({ result: "success" });
    });
  });
});
