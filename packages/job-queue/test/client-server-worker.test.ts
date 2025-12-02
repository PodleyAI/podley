/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Job } from "../src/job/Job";
import { JobQueueClient } from "../src/job/JobQueueClient";
import { JobQueueWorker } from "../src/job/JobQueueWorker";
import { JobQueueServer } from "../src/job/JobQueueServer";
import { InMemoryQueueStorage } from "@workglow/storage";
import { IJobExecuteContext } from "../src/job/Job";
import { JobStatus } from "../src/job/IJobQueue";

interface TestInput {
  value: number;
}

interface TestOutput {
  result: number;
}

class TestJob extends Job<TestInput, TestOutput> {
  async execute(input: TestInput, context: IJobExecuteContext): Promise<TestOutput> {
    await context.updateProgress(50, "Processing");
    const result = input.value * 2;
    await context.updateProgress(100, "Complete");
    return { result };
  }
}

describe("JobQueueClient", () => {
  let storage: InMemoryQueueStorage<TestInput, TestOutput>;
  let client: JobQueueClient<TestInput, TestOutput, TestJob>;

  beforeEach(() => {
    storage = new InMemoryQueueStorage<TestInput, TestOutput>("test-queue");
    client = new JobQueueClient("test-queue", TestJob, storage);
  });

  afterEach(async () => {
    await client.stop();
  });

  it("should add a job to the queue", async () => {
    const job = new TestJob({ input: { value: 5 } });
    const jobId = await client.add(job);
    expect(jobId).toBeDefined();

    const retrievedJob = await client.get(jobId);
    expect(retrievedJob).toBeDefined();
    expect(retrievedJob?.input.value).toBe(5);
  });

  it("should get queue size", async () => {
    const job1 = new TestJob({ input: { value: 1 } });
    const job2 = new TestJob({ input: { value: 2 } });

    await client.add(job1);
    await client.add(job2);

    const size = await client.size();
    expect(size).toBe(2);
  });

  it("should peek at jobs in the queue", async () => {
    const job = new TestJob({ input: { value: 10 } });
    await client.add(job);

    const jobs = await client.peek(JobStatus.PENDING, 5);
    expect(jobs.length).toBe(1);
    expect(jobs[0].input.value).toBe(10);
  });

  it("should start and stop the client", async () => {
    await client.start();
    expect(client["running"]).toBe(true);

    await client.stop();
    expect(client["running"]).toBe(false);
  });
});

describe("JobQueueWorker", () => {
  let storage: InMemoryQueueStorage<TestInput, TestOutput>;
  let worker: JobQueueWorker<TestInput, TestOutput, TestJob>;

  beforeEach(() => {
    storage = new InMemoryQueueStorage<TestInput, TestOutput>("test-queue");
    worker = new JobQueueWorker("test-queue", TestJob, storage);
  });

  afterEach(async () => {
    await worker.stop();
  });

  it("should process a job", async () => {
    const job = new TestJob({ input: { value: 7 } });
    const jobId = await storage.add({
      id: undefined,
      job_run_id: undefined,
      queue: "test-queue",
      fingerprint: undefined,
      input: { value: 7 },
      status: JobStatus.PENDING,
      output: null,
      error: null,
      error_code: null,
      run_attempts: 0,
      max_retries: 10,
      run_after: new Date().toISOString(),
      created_at: new Date().toISOString(),
      deadline_at: null,
      last_ran_at: null,
      completed_at: null,
      progress: 0,
      progress_message: "",
      progress_details: null,
    });

    let jobCompleted = false;
    worker.on("job_complete", () => {
      jobCompleted = true;
    });

    await worker.start();

    // Wait for job to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    const completedJob = await storage.get(jobId);
    expect(completedJob?.status).toBe(JobStatus.COMPLETED);
    expect(completedJob?.output?.result).toBe(14);
    expect(jobCompleted).toBe(true);
  });

  it("should get worker stats", async () => {
    const stats = worker.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalJobs).toBe(0);
    expect(stats.completedJobs).toBe(0);
    expect(stats.failedJobs).toBe(0);
  });
});

describe("JobQueueServer", () => {
  let storage: InMemoryQueueStorage<TestInput, TestOutput>;
  let server: JobQueueServer<TestInput, TestOutput, TestJob>;

  beforeEach(() => {
    storage = new InMemoryQueueStorage<TestInput, TestOutput>("test-queue");
    server = new JobQueueServer("test-queue", TestJob, storage, { workerCount: 2 });
  });

  afterEach(async () => {
    await server.stop();
  });

  it("should start with multiple workers", async () => {
    await server.start();
    expect(server.getWorkerCount()).toBe(2);
  });

  it("should process jobs across multiple workers", async () => {
    // Add multiple jobs
    for (let i = 0; i < 5; i++) {
      await storage.add({
        id: undefined,
        job_run_id: undefined,
        queue: "test-queue",
        fingerprint: undefined,
        input: { value: i },
        status: JobStatus.PENDING,
        output: null,
        error: null,
        error_code: null,
        run_attempts: 0,
        max_retries: 10,
        run_after: new Date().toISOString(),
        created_at: new Date().toISOString(),
        deadline_at: null,
        last_ran_at: null,
        completed_at: null,
        progress: 0,
        progress_message: "",
        progress_details: null,
      });
    }

    let completedCount = 0;
    server.on("job_complete", () => {
      completedCount++;
    });

    await server.start();

    // Wait for jobs to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(completedCount).toBe(5);
  });

  it("should aggregate stats from all workers", async () => {
    await server.start();
    const stats = server.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalJobs).toBeGreaterThanOrEqual(0);
  });
});

describe("Integration: Client + Server", () => {
  let storage: InMemoryQueueStorage<TestInput, TestOutput>;
  let client: JobQueueClient<TestInput, TestOutput, TestJob>;
  let server: JobQueueServer<TestInput, TestOutput, TestJob>;

  beforeEach(() => {
    storage = new InMemoryQueueStorage<TestInput, TestOutput>("test-queue");
    client = new JobQueueClient("test-queue", TestJob, storage);
    server = new JobQueueServer("test-queue", TestJob, storage, { workerCount: 1 });
  });

  afterEach(async () => {
    await client.stop();
    await server.stop();
  });

  it("should submit job via client and process via server", async () => {
    await client.start();
    await server.start();

    const job = new TestJob({ input: { value: 15 } });
    const jobId = await client.add(job);

    // Wait for job completion via client
    const result = await client.waitFor(jobId);

    expect(result).toBeDefined();
    expect(result?.result).toBe(30);
  });

  it("should track progress via client while server processes", async () => {
    await client.start();
    await server.start();

    const job = new TestJob({ input: { value: 20 } });
    const jobId = await client.add(job);

    const progressUpdates: number[] = [];
    client.onJobProgress(jobId, (progress) => {
      progressUpdates.push(progress);
    });

    await client.waitFor(jobId);

    // Should have received at least some progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);
  });
});
