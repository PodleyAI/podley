//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { sleep } from "@ellmers/util";
import { AbortSignalJobError, JobQueue } from "../job/JobQueue";
import { Job, JobStatus } from "../job/Job";
import { InMemoryRateLimiter } from "../storage/InMemoryRateLimiter";

export interface TInput {
  [key: string]: any;
}
export interface TOutput {
  [key: string]: any;
}

export class TestJob extends Job<TInput, TOutput> {
  public async execute(signal: AbortSignal): Promise<TOutput> {
    if (!this.queue) {
      throw new Error("Job must be added to a queue before execution");
    }

    if (this.input.taskType === "failing") {
      throw new Error("Job failed as expected");
    }

    if (this.input.taskType === "long_running") {
      return new Promise<TOutput>((resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            reject(new AbortSignalJobError("Aborted via signal"));
          },
          { once: true }
        );
      });
    }
    if (this.input.taskType === "progress") {
      return new Promise<TOutput>(async (resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            reject(new AbortSignalJobError("Aborted via signal"));
          },
          { once: true }
        );

        try {
          // Simulate progress updates
          await sleep(0);
          await this.updateProgress(25, "Starting task");
          await sleep(0);
          await this.updateProgress(50, "Halfway there");
          await sleep(0);
          await this.updateProgress(75, "Almost done", { stage: "final" });
          await sleep(0);
          resolve({ result: "completed with progress" });
        } catch (error) {
          reject(error);
        }
      });
    }
    return { result: this.input.data.replace("input", "output") };
  }
}

export function runGenericJobQueueTests(createJobQueue: () => JobQueue<TInput, TOutput>) {
  let jobQueue: JobQueue<TInput, TOutput>;

  beforeEach(async () => {
    jobQueue = createJobQueue();
  });

  afterEach(async () => {
    if (jobQueue) {
      await jobQueue.stop();
      await jobQueue.clear();
    }
  });

  describe("Basics", () => {
    it("should complete a job in the queue", async () => {
      const id = await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.complete(id, { result: "success" });
      const job = await jobQueue.get(id);
      expect(job?.status).toBe(JobStatus.COMPLETED);
      expect(job?.output).toEqual({ result: "success" });
    });

    it("should delete completed jobs after specified time", async () => {
      // Create a new queue with deleteAfterCompletionMs set to 1ms
      const autoDeleteQueue = createJobQueue();
      // @ts-ignore - Accessing protected property for testing
      autoDeleteQueue.options = {
        deleteAfterCompletionMs: 0, // Delete completed jobs immediately
        waitDurationInMilliseconds: 1,
      };
      await autoDeleteQueue.start();

      // Add and complete a job
      const job1Id = await autoDeleteQueue.add(
        new TestJob({ input: { taskType: "other", data: "input1" } })
      );
      await autoDeleteQueue.waitFor(job1Id);

      // Give a small delay to ensure deletion completes
      await sleep(1);

      // Job should be automatically deleted after completion
      const deletedJobExists = !!(await autoDeleteQueue.get(job1Id));
      expect(deletedJobExists).toBe(false);

      // Add another job but don't complete it
      const job2Id = await autoDeleteQueue.add(
        new TestJob({ input: { taskType: "task2", data: "input2" } })
      );
      const pendingJob = await autoDeleteQueue.get(job2Id);
      expect(pendingJob).toBeDefined();

      await autoDeleteQueue.stop();
    });

    it("should delete failed jobs after specified time", async () => {
      // Create a new queue with deleteAfterErrorMs set to 1ms
      const autoDeleteQueue = createJobQueue();
      // @ts-ignore - Accessing protected property for testing
      autoDeleteQueue.options = {
        deleteAfterErrorMs: 1, // Delete failed jobs after 1ms
        waitDurationInMilliseconds: 1,
      };
      await autoDeleteQueue.start();

      // Add a job that will fail
      const jobId = await autoDeleteQueue.add(
        new TestJob({ input: { taskType: "failing", data: "input1" } })
      );

      try {
        await autoDeleteQueue.waitFor(jobId);
      } catch (error) {
        // Expected error
      }

      // Give a small delay to ensure deletion completes
      await sleep(5);

      // Failed job should be automatically deleted
      const deletedJobExists = !!(await autoDeleteQueue.get(jobId));
      expect(deletedJobExists).toBe(false);

      await autoDeleteQueue.stop();
    });

    it("should not delete jobs when timing options are undefined", async () => {
      // Create a new queue with no deletion options
      const queue = createJobQueue();
      await queue.start();

      // Add and complete a job
      const jobId = await queue.add(new TestJob({ input: { taskType: "other", data: "input1" } }));
      await queue.waitFor(jobId);

      // Give a small delay
      await sleep(5);

      // Job should still exist
      const job = await queue.get(jobId);
      expect(job).toBeDefined();
      expect(job?.status).toBe(JobStatus.COMPLETED);

      await queue.stop();
    });

    it("should delete jobs immediately when timing is set to 0", async () => {
      // Create a new queue with immediate deletion
      const queue = createJobQueue();
      // @ts-ignore - Accessing protected property for testing
      queue.options = {
        deleteAfterCompletionMs: 0, // Delete completed jobs immediately
        deleteAfterErrorMs: 0, // Delete failed jobs immediately
        waitDurationInMilliseconds: 1,
      };
      await queue.start();

      // Test completed job
      const completedJobId = await queue.add(
        new TestJob({ input: { taskType: "other", data: "input1" } })
      );
      await queue.waitFor(completedJobId);
      const completedJobExists = !!(await queue.get(completedJobId));
      expect(completedJobExists).toBe(false);

      // Test failed job
      const failedJobId = await queue.add(
        new TestJob({ input: { taskType: "failing", data: "input2" } })
      );
      try {
        await queue.waitFor(failedJobId);
      } catch (error) {
        // Expected error
      }
      const failedJob = !!(await queue.get(failedJobId));
      expect(failedJob).toBe(false);

      await queue.stop();
    });

    it("should add a job to the queue", async () => {
      const job = new TestJob({ input: { taskType: "task1", data: "input1" } });
      const id = await jobQueue.add(job);
      expect(await jobQueue.size()).toBe(1);
      const retrievedJob = await jobQueue.get(id);
      expect(retrievedJob?.status).toBe(JobStatus.PENDING);
      expect(retrievedJob?.input.taskType).toBe("task1");
      expect(retrievedJob?.id).toBe(id);
    });

    it("should process jobs and get stats", async () => {
      await jobQueue.start();
      const job1 = new TestJob({ input: { taskType: "other", data: "input1" } });
      const job2 = new TestJob({ input: { taskType: "other", data: "input2" } });
      const job1id = await jobQueue.add(job1);
      const job2id = await jobQueue.add(job2);
      await jobQueue.waitFor(job1id);
      await jobQueue.waitFor(job2id);

      const stats = jobQueue.getStats();
      expect(stats.completedJobs).toBe(2);
      expect(stats.failedJobs).toBe(0);
      expect(stats.abortedJobs).toBe(0);
      expect(stats.retriedJobs).toBe(0);
    });

    it("should clear all jobs in the queue", async () => {
      const job1 = new TestJob({ input: { taskType: "task1", data: "input1" } });
      const job2 = new TestJob({ input: { taskType: "task1", data: "input1" } });
      await jobQueue.add(job1);
      await jobQueue.add(job2);
      expect(await jobQueue.size()).toBe(2);
      await jobQueue.clear();
      expect(await jobQueue.size()).toBe(0);
    });

    it("should retrieve the output for a given task type and input", async () => {
      const id = await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task2", data: "input2" } }));
      await jobQueue.complete(id, { result: "success" });
      const output = await jobQueue.outputForInput({ taskType: "task1", data: "input1" });
      expect(output).toEqual({ result: "success" });
    });

    it("should run the queue and execute all", async () => {
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task2", data: "input2" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      const last = await jobQueue.add(
        new TestJob({ input: { taskType: "task2", data: "input2" } })
      );
      await jobQueue.start();
      await jobQueue.waitFor(last);
      await jobQueue.stop();
      const job4 = await jobQueue.get(last);
      expect(job4?.status).toBe(JobStatus.COMPLETED);
      expect(job4?.output).toEqual({ result: "output2" });
    });

    it("should run the queue and get rate limited", async () => {
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task2", data: "input2" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      const last = await jobQueue.add(
        new TestJob({ input: { taskType: "task2", data: "input2" } })
      );
      await jobQueue.start();
      await sleep(10);
      await jobQueue.stop();
      const lastid = await jobQueue.get(last);
      expect(lastid?.status).toBe(JobStatus.PENDING);
    });

    it("should abort a long-running job and trigger the abort event", async () => {
      const job = new TestJob({
        input: { taskType: "long_running", data: "input101" },
      });
      const jobId = await jobQueue.add(job);
      let abortEventTriggered = false;
      jobQueue.on("job_aborting", (qn: any, jobId: any) => {
        if (jobId === job.id) {
          abortEventTriggered = true;
        }
      });
      const waitPromise = jobQueue.waitFor(job.id);
      expect(await jobQueue.size()).toBe(1);
      await jobQueue.start();
      await sleep(5);
      const jobcheck = await jobQueue.get(job.id);
      expect(jobcheck?.status).toBe(JobStatus.PROCESSING);
      await jobQueue.abort(job.id);
      expect(waitPromise).rejects.toMatchObject({
        name: "AbortSignalJobError",
        message: "Aborted via signal",
      });
      expect(abortEventTriggered).toBe(true);
      const finalJob = await jobQueue.get(jobId);
      expect(finalJob?.status).toBeOneOf([JobStatus.FAILED, JobStatus.ABORTING]);
    });

    it("should abort all jobs in a job run while leaving other jobs unaffected", async () => {
      const jobRunId1 = "test-run-1";
      const jobRunId2 = "test-run-2";
      const job1 = new TestJob({
        jobRunId: jobRunId1,
        input: { taskType: "long_running", data: "input1" },
      });
      const job2 = new TestJob({
        jobRunId: jobRunId1,
        input: { taskType: "long_running", data: "input2" },
      });
      const job3 = new TestJob({
        jobRunId: jobRunId2,
        input: { taskType: "long_running", data: "input3" },
      });
      const job4 = new TestJob({
        jobRunId: jobRunId2,
        input: { taskType: "long_running", data: "input4" },
      });
      const job1id = await jobQueue.add(job1);
      const job2id = await jobQueue.add(job2);
      const job3id = await jobQueue.add(job3);
      const job4id = await jobQueue.add(job4);
      expect(await jobQueue.size()).toBe(4);
      await jobQueue.start();

      // Wait for jobs to start processing
      let attempts = 0;
      while (attempts < 10) {
        const job3Status = (await jobQueue.get(job3id))?.status;
        const job4Status = (await jobQueue.get(job4id))?.status;
        if (job3Status === JobStatus.PROCESSING && job4Status === JobStatus.PROCESSING) {
          break;
        }
        await sleep(5);
        attempts++;
      }

      await jobQueue.abortJobRun(jobRunId1);
      await sleep(5);

      // Verify job statuses
      expect((await jobQueue.get(job1id))?.status).toBeOneOf([
        JobStatus.FAILED,
        JobStatus.ABORTING,
      ]);
      expect((await jobQueue.get(job2id))?.status).toBeOneOf([
        JobStatus.FAILED,
        JobStatus.ABORTING,
      ]);

      const job3Status = (await jobQueue.get(job3id))?.status;
      const job4Status = (await jobQueue.get(job4id))?.status;
      expect(job3Status).toBe(JobStatus.PROCESSING);
      expect(job4Status).toBe(JobStatus.PROCESSING);

      await jobQueue.stop();
    });
  });

  describe("Progress Monitoring", () => {
    it("should emit progress events only when progress changes", async () => {
      await jobQueue.start();
      const progressEvents: Array<{
        progress: number;
        message: string;
        details: Record<string, any> | null;
      }> = [];

      const job = new TestJob({ input: { taskType: "progress", data: "input1" } });
      const jobId = await jobQueue.add(job);

      // Listen for progress events
      jobQueue.on("job_progress", (_queueName, id, progress, message, details) => {
        if (id === jobId) {
          progressEvents.push({ progress, message, details });
        }
      });

      // Wait for job completion
      await jobQueue.waitFor(jobId);

      // Verify progress events
      expect(progressEvents.length).toBe(3); // Should have 3 unique progress updates
      expect(progressEvents[0]).toEqual({
        progress: 25,
        message: "Starting task",
        details: null,
      });
      expect(progressEvents[1]).toEqual({
        progress: 50,
        message: "Halfway there",
        details: null,
      });
      expect(progressEvents[2]).toEqual({
        progress: 75,
        message: "Almost done",
        details: { stage: "final" },
      });
    });

    it("should validate progress values", async () => {
      const job = new TestJob({ input: { taskType: "other", data: "input1" } });
      const jobId = await jobQueue.add(job);

      // Test invalid progress values
      await jobQueue.updateProgress(jobId, -10, "Should be 0");
      const jobNeg = await jobQueue.get(jobId);
      expect(jobNeg?.progress).toBe(0);

      await jobQueue.updateProgress(jobId, 150, "Should be 100");
      const jobOver = await jobQueue.get(jobId);
      expect(jobOver?.progress).toBe(100);
    });

    it("should support job-specific progress listeners", async () => {
      await jobQueue.start();
      const progressUpdates: Array<{
        progress: number;
        message: string;
        details: Record<string, any> | null;
      }> = [];

      const job = new TestJob({ input: { taskType: "progress", data: "input1" } });
      const jobId = await jobQueue.add(job);

      // Add job-specific listener
      const cleanup = jobQueue.onJobProgress(jobId, (progress, message, details) => {
        progressUpdates.push({ progress, message, details });
      });

      // Wait for job completion
      await jobQueue.waitFor(jobId);

      // Clean up listener
      cleanup();

      // Verify progress updates
      expect(progressUpdates.length).toBe(3);
      expect(progressUpdates[0]).toEqual({
        progress: 25,
        message: "Starting task",
        details: null,
      });
      expect(progressUpdates[1]).toEqual({
        progress: 50,
        message: "Halfway there",
        details: null,
      });
      expect(progressUpdates[2]).toEqual({
        progress: 75,
        message: "Almost done",
        details: { stage: "final" },
      });
    });

    it("should clean up progress listeners for completed jobs", async () => {
      await jobQueue.start();
      const job = new TestJob({ input: { taskType: "progress", data: "input1" } });
      const jobId = await jobQueue.add(job);

      let listenerCalls = 0;
      const cleanup = jobQueue.onJobProgress(jobId, () => {
        listenerCalls++;
      });

      // Wait for job completion
      await jobQueue.waitFor(jobId);
      await sleep(2);

      // Try to update progress after completion (should not trigger listener)
      try {
        await jobQueue.updateProgress(jobId, 99, "Should not emit");
      } catch (error) {
        // Expected error for completed job
      }

      cleanup();
      expect(listenerCalls).toBe(3); // Should only have the original 3 progress updates
    });

    it("should handle multiple jobs with progress monitoring", async () => {
      await jobQueue.start();
      const progressByJob = new Map<unknown, number[]>();

      // Create and start multiple jobs
      const jobs = await Promise.all([
        jobQueue.add(new TestJob({ input: { taskType: "progress", data: "job1" } })),
        jobQueue.add(new TestJob({ input: { taskType: "progress", data: "job2" } })),
      ]);

      // Set up listeners for each job
      const cleanups = jobs.map((jobId) => {
        progressByJob.set(jobId, []);
        return jobQueue.onJobProgress(jobId, (progress) => {
          progressByJob.get(jobId)?.push(progress);
        });
      });

      // Wait for all jobs to complete
      await Promise.all(jobs.map((jobId) => jobQueue.waitFor(jobId)));

      // Clean up listeners
      cleanups.forEach((cleanup) => cleanup());

      // Verify each job had correct progress updates
      jobs.forEach((jobId) => {
        const updates = progressByJob.get(jobId);
        expect(updates).toBeDefined();
        expect(updates?.length).toBe(3);
        expect(updates).toEqual([25, 50, 75]);
      });
    });
  });

  describe("Limiter Functionality", () => {
    it("should respect concurrent job limits", async () => {
      // Set up multiple jobs that take some time to complete
      const jobs = [];
      for (let i = 0; i < 10; i++) {
        const job = new TestJob({
          input: { taskType: "progress", data: `input${i}` },
        });
        const jobId = await jobQueue.add(job);
        jobs.push(jobId);
      }

      await jobQueue.start();
      await sleep(1); // Give some time for jobs to start

      // Check that only the allowed number of jobs are processing
      const processingJobs = await jobQueue.peek(JobStatus.PROCESSING);
      expect(processingJobs.length).toBeLessThanOrEqual(5); // Assuming default concurrency limit

      // Check that remaining jobs are still pending
      const pendingJobs = await jobQueue.peek(JobStatus.PENDING);
      expect(pendingJobs.length).toBeGreaterThan(0);

      await jobQueue.stop();
    });

    it("should respect rate limits over time", async () => {
      const jobs = [];

      // Add a burst of jobs
      for (let i = 0; i < 20; i++) {
        const job = new TestJob({
          input: { taskType: "other", data: `input${i}` },
        });
        const jobId = await jobQueue.add(job);
        jobs.push(jobId);
      }

      await jobQueue.start();

      // Check that some jobs are still pending due to rate limiting
      const pendingAfterBurst = await jobQueue.peek(JobStatus.PENDING);
      expect(pendingAfterBurst.length).toBeGreaterThan(0);

      await jobQueue.stop();
    });

    it("should handle job type specific limits", async () => {
      // Add mix of different job types
      const type1Jobs = [];
      const type2Jobs = [];

      // Add jobs of type1
      for (let i = 0; i < 5; i++) {
        const job = new TestJob({
          input: { taskType: "type1", data: `input${i}` },
        });
        const jobId = await jobQueue.add(job);
        type1Jobs.push(jobId);
      }

      // Add jobs of type2
      for (let i = 0; i < 5; i++) {
        const job = new TestJob({
          input: { taskType: "type2", data: `input${i}` },
        });
        const jobId = await jobQueue.add(job);
        type2Jobs.push(jobId);
      }

      await jobQueue.start();

      // Check processing jobs of each type
      const allProcessing = await jobQueue.peek(JobStatus.PROCESSING);
      const type1Processing = allProcessing.filter((job) => job.input.taskType === "type1");
      const type2Processing = allProcessing.filter((job) => job.input.taskType === "type2");

      // Each type should be limited independently
      expect(type1Processing.length).toBeLessThanOrEqual(5);
      expect(type2Processing.length).toBeLessThanOrEqual(5);

      await jobQueue.stop();
    });

    it("should recover rate limits after pause", async () => {
      // Add a single quick job to test rate limiting
      const initialJob = new TestJob({
        input: { taskType: "other", data: "test_job" },
      });
      const initialJobId = await jobQueue.add(initialJob);

      // Start queue and wait for job to complete
      await jobQueue.start();
      await jobQueue.waitFor(initialJobId);

      // Verify first job completed
      const firstJobResult = await jobQueue.get(initialJobId);
      expect(firstJobResult?.status).toBe(JobStatus.COMPLETED);

      // Stop queue
      await jobQueue.stop();

      // Add another job after pause
      const newJob = new TestJob({
        input: { taskType: "other", data: "after_pause" },
      });
      const newJobId = await jobQueue.add(newJob);

      // Start queue again and wait for new job
      await jobQueue.start();

      // Wait for job with a reasonable timeout
      try {
        await Promise.race([
          jobQueue.waitFor(newJobId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout waiting for job")), 20)
          ),
        ]);

        const job = await jobQueue.get(newJobId);
        expect(job?.status).toBe(JobStatus.COMPLETED);
      } finally {
        await jobQueue.stop();
      }
    });

    it("should handle burst capacity limits", async () => {
      const jobs = [];

      // Try to add jobs faster than the rate limit
      for (let i = 0; i < 30; i++) {
        const job = new TestJob({
          input: { taskType: "progress", data: `input${i}` },
        });
        const jobId = await jobQueue.add(job);
        jobs.push(jobId);
      }

      await jobQueue.start();
      await sleep(1); // Give more time for jobs to start processing

      // Check that burst capacity is respected
      const allJobs = await Promise.all(jobs.map((id) => jobQueue.get(id)));
      const pending = allJobs.filter((job) => job?.status === JobStatus.PENDING);

      // Some jobs should be pending due to rate limiting
      expect(pending.length).toBeGreaterThan(0);

      await jobQueue.stop();
    });
  });
}
