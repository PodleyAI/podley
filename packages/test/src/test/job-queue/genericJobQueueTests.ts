/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AbortSignalJobError,
  IJobExecuteContext,
  ILimiter,
  Job,
  JobError,
  JobQueue,
  JobQueueOptions,
  JobStatus,
  PermanentJobError,
  RetryableJobError,
} from "@podley/job-queue";
import { IQueueStorage } from "@podley/storage";
import { BaseError, sleep, uuid4 } from "@podley/util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

export interface TInput {
  [key: string]: any;
}
export interface TOutput {
  [key: string]: any;
}

export class TestJob extends Job<TInput, TOutput> {
  public async execute(input: TInput, context: IJobExecuteContext): Promise<TOutput> {
    if (input.taskType === "failing") {
      throw new JobError("Job failed as expected");
    }

    if (input.taskType === "failing_retryable") {
      throw new RetryableJobError("Job failed but can be retried");
    }

    if (input.taskType === "permanent_fail") {
      throw new PermanentJobError("Permanent failure - do not retry");
    }

    if (input.taskType === "long_running") {
      return new Promise<TOutput>((resolve, reject) => {
        context.signal.addEventListener(
          "abort",
          () => {
            reject(new AbortSignalJobError("Aborted via signal"));
          },
          { once: true }
        );
      });
    }
    if (input.taskType === "progress") {
      return new Promise<TOutput>(async (resolve, reject) => {
        context.signal.addEventListener(
          "abort",
          () => {
            reject(new AbortSignalJobError("Aborted via signal"));
          },
          { once: true }
        );

        try {
          // Simulate progress updates
          await sleep(0);
          await context.updateProgress(25, "Starting task");
          await sleep(0);
          await context.updateProgress(50, "Halfway there");
          await sleep(0);
          await context.updateProgress(75, "Almost done", { stage: "almost final" });
          await sleep(0);
          await context.updateProgress(100, "Completed", { stage: "final" });
          resolve({ result: "completed with progress" });
        } catch (error) {
          reject(error);
        }
      });
      q;
    }
    return { result: input.data.replace("input", "output") };
  }
}

export function runGenericJobQueueTests(
  storage: (
    queueName: string,
    options?: JobQueueOptions<TInput, TOutput>
  ) => IQueueStorage<TInput, TOutput>,
  limiter?: (queueName: string, maxExecutions: number, windowSizeInSeconds: number) => ILimiter
) {
  let jobQueue: JobQueue<TInput, TOutput, TestJob>;
  beforeEach(async () => {
    const queueName = `test-queue-${uuid4()}`;
    const storageInstance = storage(queueName);
    await storageInstance.setupDatabase();
    jobQueue = new JobQueue<TInput, TOutput, TestJob>(queueName, TestJob as any, {
      storage: storageInstance,
      limiter: limiter?.(queueName, 4, 60),
      waitDurationInMilliseconds: 1,
    });
  });

  afterEach(async () => {
    if (jobQueue) {
      await jobQueue.stop();
      await jobQueue.clear();
    }
  });

  describe("Basics", () => {
    it("should add a job to the queue", async () => {
      const job = new TestJob({ input: { taskType: "task1", data: "input1" } });
      const id = await jobQueue.add(job);
      expect(await jobQueue.size()).toBe(1);
      const retrievedJob = await jobQueue.get(id);
      expect(retrievedJob?.status).toBe(JobStatus.PENDING);
      expect(retrievedJob?.input.taskType).toBe("task1");
      expect(retrievedJob?.id).toBe(id);
    });

    it("should complete a job in the queue", async () => {
      const id = await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      const jobcheck = await jobQueue.get(id);
      // @ts-ignore - Accessing private method for testing
      await jobQueue.completeJob(jobcheck, { result: "success" });
      expect(jobcheck?.status).toBe(JobStatus.COMPLETED);
      expect(jobcheck?.output).toEqual({ result: "success" });
    });

    it("should delete completed jobs after specified time", async () => {
      const deleteAfterCompletionMs = 10;
      // @ts-ignore - Accessing protected property for testing
      jobQueue.options = {
        deleteAfterCompletionMs, // Delete completed jobs immediately
        waitDurationInMilliseconds: 1,
      };
      await jobQueue.start();

      // Add and complete a job
      const job1Id = await jobQueue.add(
        new TestJob({ input: { taskType: "other", data: "input1" } })
      );
      await jobQueue.waitFor(job1Id);

      const jobExists = !!(await jobQueue.get(job1Id));
      expect(jobExists).toBe(true);

      await sleep(deleteAfterCompletionMs * 2);

      const deletedJobExists = !!(await jobQueue.get(job1Id));
      expect(deletedJobExists).toBe(false);
    });

    it("should not delete jobs when timing options are undefined", async () => {
      // Create a new queue with no deletion options
      await jobQueue.start();

      // Add and complete a job
      const jobId = await jobQueue.add(
        new TestJob({ input: { taskType: "other", data: "input1" } })
      );
      await jobQueue.waitFor(jobId);

      // Give a small delay
      await sleep(5);

      // Job should still exist
      const job = await jobQueue.get(jobId);
      expect(job).toBeDefined();
      expect(job?.status).toBe(JobStatus.COMPLETED);
    });

    it("should delete jobs immediately when timing is set to 0", async () => {
      // @ts-ignore - Accessing protected property for testing
      jobQueue.options = {
        deleteAfterCompletionMs: 0, // Delete completed jobs immediately
        deleteAfterFailureMs: 0, // Delete failed jobs immediately
        waitDurationInMilliseconds: 1,
      };
      await jobQueue.start();

      // Test completed job
      const completedJobId = await jobQueue.add(
        new TestJob({ input: { taskType: "other", data: "input1" } })
      );
      await jobQueue.waitFor(completedJobId);
      const completedJobExists = !!(await jobQueue.get(completedJobId));
      expect(completedJobExists).toBe(false);

      // Test failed job
      const failedJobId = await jobQueue.add(
        new TestJob({ input: { taskType: "failing", data: "input2" } })
      );
      try {
        await jobQueue.waitFor(failedJobId);
      } catch (error) {
        // Expected error
      }
      const failedJob = !!(await jobQueue.get(failedJobId));
      expect(failedJob).toBe(false);

      await jobQueue.stop();
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
      const job = new TestJob({ input: { taskType: "task1", data: "input1" } });
      const id = await jobQueue.add(job);
      await jobQueue.start();
      await jobQueue.waitFor(id);
      const output = await jobQueue.outputForInput({ taskType: "task1", data: "input1" });
      expect(output).toEqual({ result: "output1" });
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
      await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      const lastId = await jobQueue.add(
        new TestJob({ input: { taskType: "task2", data: "input2" } })
      );
      await jobQueue.start();
      await sleep(10);
      await jobQueue.stop();
      const last = await jobQueue.get(lastId);
      expect(last?.status).toBe(JobStatus.PENDING);
    });

    it("should abort a long-running job and trigger the abort event", async () => {
      const jobId = await jobQueue.add(
        new TestJob({
          input: { taskType: "long_running", data: "input101" },
        })
      );
      let abortEventTriggered = false;
      jobQueue.on("job_aborting", (qn: any, eventJobId: any) => {
        if (eventJobId === jobId) {
          abortEventTriggered = true;
        }
      });
      const waitPromise = jobQueue.waitFor(jobId);
      expect(await jobQueue.size()).toBe(1);
      await jobQueue.start();

      // Wait for job to start processing
      let attempts = 0;
      while (attempts < 100) {
        const jobcheck = await jobQueue.get(jobId);
        if (jobcheck?.status === JobStatus.PROCESSING) {
          break;
        }
        await sleep(10);
        attempts++;
      }

      const jobcheck = await jobQueue.get(jobId);
      expect(jobcheck?.status).toBe(JobStatus.PROCESSING);
      try {
        await jobQueue.abort(jobId);
        const abortcheck = await jobQueue.get(jobId);
        expect(abortcheck?.status).toBe(JobStatus.ABORTING);
        await waitPromise;
      } catch (error) {
        expect(error).toBeInstanceOf(AbortSignalJobError);
      }
      const failedcheck = await jobQueue.get(jobId);
      expect(failedcheck?.status).toBe(JobStatus.FAILED);

      await expect(waitPromise).rejects.toMatchObject({
        name: "AbortSignalJobError",
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
      while (attempts < 50) {
        const job3Status = (await jobQueue.get(job3id))?.status;
        const job4Status = (await jobQueue.get(job4id))?.status;
        if (job3Status === JobStatus.PROCESSING && job4Status === JobStatus.PROCESSING) {
          break;
        }
        await sleep(1);
        attempts++;
      }

      await jobQueue.abortJobRun(jobRunId1);
      while (attempts < 50) {
        const job3Status = (await jobQueue.get(job3id))?.status;
        const job4Status = (await jobQueue.get(job4id))?.status;
        if (
          [JobStatus.FAILED, JobStatus.ABORTING].includes(job3Status!) &&
          [JobStatus.FAILED, JobStatus.ABORTING].includes(job4Status!)
        ) {
          break;
        }
        await sleep(1);
        attempts++;
      }

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
    });

    it("should skip a job", async () => {
      const id = await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.skip(id);
      await jobQueue.waitFor(id);
      const jobcheck = await jobQueue.get(id);
      expect(jobcheck?.status).toBe(JobStatus.SKIPPED);
    });

    it("should wait for a job to complete", async () => {
      const id = await jobQueue.add(new TestJob({ input: { taskType: "task1", data: "input1" } }));
      await jobQueue.start();
      const output = await jobQueue.waitFor(id);
      expect(output).toEqual({ result: "output1" });
      const job = await jobQueue.get(id);
      expect(job?.status).toBe(JobStatus.COMPLETED);
      expect(job?.output).toEqual({ result: "output1" });
    });
  });

  describe("Progress Monitoring", () => {
    it("should emit progress events", async () => {
      await jobQueue.start();
      const progressEvents: Array<{
        progress: number;
        message: string;
        details: Record<string, any> | null;
      }> = [];

      const jobId = await jobQueue.add(
        new TestJob({ input: { taskType: "progress", data: "input1" } })
      );

      // Listen for progress events
      jobQueue.on("job_progress", (_queueName, id, progress, message, details) => {
        if (id === jobId) {
          progressEvents.push({ progress, message, details });
        }
      });

      // Wait for job completion
      await jobQueue.waitFor(jobId);

      // Verify progress events
      expect(progressEvents.length).toBe(4); // Should have 4 unique progress updates
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
        details: { stage: "almost final" },
      });
      expect(progressEvents[3]).toEqual({
        progress: 100,
        message: "Completed",
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

      expect(progressUpdates.length).toBe(4); // Should have 4 unique progress updates
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
        details: { stage: "almost final" },
      });
      expect(progressUpdates[3]).toEqual({
        progress: 100,
        message: "Completed",
        details: { stage: "final" },
      });
    });

    it("should clean up progress listeners for completed jobs", async () => {
      await jobQueue.start();
      const job = new TestJob({ input: { taskType: "progress", data: "input1" } });
      const jobId = await jobQueue.add(job);

      let listenerCalls = 0;
      let listenerArgs: any[] = [];
      const cleanup = jobQueue.onJobProgress(jobId, (...args) => {
        listenerCalls++;
        listenerArgs.push(args);
      });

      // Wait for job completion
      await jobQueue.waitFor(jobId);

      // Try to update progress after completion (should not trigger listener)
      try {
        await jobQueue.updateProgress(jobId, 99, "Should not emit");
      } catch (error) {
        // Expected error for completed job
      }

      cleanup();
      expect(listenerCalls).toBe(4); // Should only have the original 4 progress updates
    });

    it("should handle multiple jobs with progress monitoring", async () => {
      await jobQueue.start();
      const progressByJob = new Map<unknown, number[]>();
      // Create and start multiple jobs
      const jobs = await Promise.all([
        // jobQueue.add(new TestJob({ input: { taskType: "progress", data: "job1" } })),
        // jobQueue.add(new TestJob({ input: { taskType: "progress", data: "job2" } })),
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
        expect(updates?.length).toBe(4);
        expect(updates).toEqual([25, 50, 75, 100]);
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
      const numJobs = 20;
      const jobIds = new Set<unknown>();

      // Add burst of jobs
      for (let i = 0; i < numJobs; i++) {
        const job = new TestJob({
          input: { taskType: "other", data: `input${i}` },
        });
        const id = await jobQueue.add(job);
        jobIds.add(id);
      }

      await jobQueue.start();
      const pendingAfterBurst = await jobQueue.size(JobStatus.PENDING);
      expect(pendingAfterBurst).toBeGreaterThan(0);
      // Wait longer for IndexedDB operations to complete
      // @ts-ignore - Accessing protected property for testing
      await sleep(storage.name.includes("IndexedDb") ? 30 : 3);

      // Helper function to get job counts with runAttempts
      async function getJobCounts(
        runAttempts = 5,
        retryDelay = 3
      ): Promise<{ pending: number; processing: number; completed: number }> {
        for (let i = 0; i < runAttempts; i++) {
          try {
            const pending = await jobQueue.size(JobStatus.PENDING);
            const processing = await jobQueue.size(JobStatus.PROCESSING);
            const completed = await jobQueue.size(JobStatus.COMPLETED);

            // Verify we're not counting any jobs multiple times
            if (pending + processing + completed <= numJobs) {
              return { pending, processing, completed };
            }
          } catch (err) {
            if (i === runAttempts - 1) throw err;
            await sleep(retryDelay);
          }
        }
        throw new JobError("Failed to get consistent job counts");
      }

      // Check job states
      const counts = await getJobCounts();

      // Some jobs should be completed
      expect(counts.completed).toBeGreaterThan(0);

      // Some jobs should still be pending due to rate limiting
      expect(counts.pending).toBeGreaterThan(0);

      // The total number of jobs should match what we created
      expect(counts.pending + counts.processing + counts.completed).toBe(numJobs);

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
  describe("Job Queue Restart", () => {
    it("should recover rate limits after pause", async () => {
      // Add a single quick job to test rate limiting

      const initialJobId = await jobQueue.add(
        new TestJob({
          input: { taskType: "other", data: "test_job" },
        })
      );

      // Start queue and wait for job to complete
      await jobQueue.start();
      await jobQueue.waitFor(initialJobId);

      // Verify first job completed
      const firstJobResult = await jobQueue.get(initialJobId);
      expect(firstJobResult?.status).toBe(JobStatus.COMPLETED);

      // Stop queue
      await jobQueue.stop();

      // Add another job after pause
      const newJobId = await jobQueue.add(
        new TestJob({
          input: { taskType: "other", data: "after_pause" },
        })
      );

      const pendingJob = await jobQueue.get(newJobId);
      expect(pendingJob?.status).toBe(JobStatus.PENDING);

      // Start queue again and wait for new job
      await jobQueue.start();
      await jobQueue.waitFor(newJobId);

      const completedJob = await jobQueue.get(newJobId);
      expect(completedJob?.status).toBe(JobStatus.COMPLETED);

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

    it("should fix stuck processing jobs on start", async () => {
      // Create a job and manually set it to PROCESSING state
      const jobId = await jobQueue.add(new TestJob({ input: { data: "test" } }));
      const job = await jobQueue.get(jobId);
      // @ts-ignore - Accessing protected property for testing
      await jobQueue.storage.complete({
        ...jobQueue.classToStorage(job!),
        status: JobStatus.PROCESSING,
        last_ran_at: new Date().toISOString(),
        run_attempts: 1,
      });

      const checkJob = await jobQueue.get(jobId);
      expect(checkJob).toBeDefined();
      expect(checkJob!.status).toBe(JobStatus.PROCESSING);
      expect(checkJob!.lastRanAt).toBeDefined();

      // @ts-ignore - Accessing protected method for testing
      await jobQueue.fixupJobs();

      // Get the job and verify it was marked for retry
      const updatedJob = await jobQueue.get(jobId);
      expect(updatedJob).toBeDefined();
      expect(updatedJob!.status).toBe(JobStatus.PENDING);
      expect(updatedJob!.error).toBe("Restarting server");
      expect(updatedJob!.runAttempts).toBe(3);
    });

    it("should fix stuck aborting jobs on start", async () => {
      // Create a job and manually set it to ABORTING state
      const job = new TestJob({ input: { value: "test" } });
      const jobId = await jobQueue.add(job);
      // @ts-ignore - Accessing protected property for testing
      await jobQueue.storage.complete({
        ...jobQueue.classToStorage(job),
        id: jobId,
        status: JobStatus.ABORTING,
        last_ran_at: new Date().toISOString(),
      });

      // @ts-ignore - Accessing protected method for testing
      await jobQueue.fixupJobs();

      // Get the job and verify it was marked for retry
      const updatedJob = await jobQueue.get(jobId);
      expect(updatedJob).toBeDefined();
      expect(updatedJob!.status).toBe(JobStatus.PENDING);
      expect(updatedJob!.error).toBe("Restarting server");
      expect(updatedJob!.runAttempts).toBe(3);
    });

    it("should handle multiple stuck jobs", async () => {
      // Create multiple jobs in different stuck states
      const processingJob = new TestJob({ input: { value: "processing" } });
      const abortingJob = new TestJob({ input: { value: "aborting" } });

      const processingJobId = await jobQueue.add(processingJob);
      const abortingJobId = await jobQueue.add(abortingJob);

      // @ts-ignore - Accessing protected property for testing
      await jobQueue.storage.complete({
        ...jobQueue.classToStorage(processingJob),
        id: processingJobId,
        status: JobStatus.PROCESSING,
        last_ran_at: new Date().toISOString(),
      });

      // @ts-ignore - Accessing protected property for testing
      await jobQueue.storage.complete({
        ...jobQueue.classToStorage(abortingJob),
        id: abortingJobId,
        status: JobStatus.ABORTING,
        last_ran_at: new Date().toISOString(),
      });

      /// @ts-ignore - Accessing protected method for testing
      await jobQueue.fixupJobs();

      // Verify both jobs were fixed
      const updatedProcessingJob = await jobQueue.get(processingJobId);
      const updatedAbortingJob = await jobQueue.get(abortingJobId);

      expect(updatedProcessingJob!.status).toBe(JobStatus.PENDING);
      expect(updatedProcessingJob!.error).toBe("Restarting server");
      expect(updatedProcessingJob!.runAttempts).toBe(3);

      expect(updatedAbortingJob!.status).toBe(JobStatus.PENDING);
      expect(updatedAbortingJob!.error).toBe("Restarting server");
      expect(updatedAbortingJob!.runAttempts).toBe(3);
    });

    it("should not affect jobs in other states", async () => {
      // Create a job in PENDING state
      const pendingJob = new TestJob({ input: { value: "pending" } });
      const pendingJobId = await jobQueue.add(pendingJob);

      // Create a job in COMPLETED state
      const completedJobId = await jobQueue.add(new TestJob({ input: { value: "completed" } }));
      const completedJob = await jobQueue.get(completedJobId);
      // @ts-ignore - Accessing protected method for testing
      await jobQueue.completeJob(completedJob, { result: "done" });

      // Create a job in FAILED state
      const failedJobId = await jobQueue.add(new TestJob({ input: { value: "failed" } }));
      const failedJob = await jobQueue.get(failedJobId);
      // @ts-ignore - Accessing protected method for testing
      await jobQueue.failJob(failedJob, new PermanentJobError("Failed"));

      // @ts-ignore - Accessing protected method for testing
      await jobQueue.fixupJobs();

      // Verify jobs in other states were not affected
      const updatedPendingJob = await jobQueue.get(pendingJobId);
      const updatedCompletedJob = await jobQueue.get(completedJobId);
      const updatedFailedJob = await jobQueue.get(failedJobId);

      expect(updatedPendingJob!.status).toBe(JobStatus.PENDING);
      expect(updatedPendingJob!.error).toBeNull();
      expect(updatedPendingJob!.runAttempts).toBe(0);

      expect(updatedCompletedJob!.status).toBe(JobStatus.COMPLETED);
      expect(updatedFailedJob!.status).toBe(JobStatus.FAILED);
    });
  });

  describe("Error Handling", () => {
    it("should handle job failures and mark job as failed", async () => {
      const jobId = await jobQueue.add(
        new TestJob({
          input: { taskType: "failing", data: "will-fail" },
          maxRetries: 0, // Ensure no runAttempts
        })
      );

      let error: Error | null = null;
      try {
        await jobQueue.start();
        await jobQueue.waitFor(jobId);
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(BaseError);
      expect(error?.message).toBe("Job failed as expected");

      const failedJob = await jobQueue.get(jobId);
      expect(failedJob?.status).toBe(JobStatus.FAILED);
      expect(failedJob?.error).toBe("Job failed as expected");
      expect(failedJob?.errorCode).toBe("JobError");
      expect(failedJob?.runAttempts).toBe(1);
    });

    it("should retry a failed job up to maxRetries", async () => {
      const jobId = await jobQueue.add(
        new TestJob({
          input: { taskType: "failing_retryable", data: "will-retry" },
          maxRetries: 2, // Allow 3 runAttempts
        })
      );

      let error: Error | null = null;
      try {
        await jobQueue.start();
        await jobQueue.waitFor(jobId);
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(RetryableJobError);
      expect(error?.message).toBe("Job failed but can be retried");
      // Wait for runAttempts to complete
      await sleep(10);

      const failedJob = await jobQueue.get(jobId);
      expect(failedJob?.status).toBe(JobStatus.FAILED);
      expect(failedJob?.runAttempts).toBe(4); // Should have attempted 3 runAttempts, two retries and one initial run
      expect(failedJob?.error).toBe("Job failed but can be retried");

      await jobQueue.stop();
    });

    it("should handle permanent failures without retrying", async () => {
      await jobQueue.start();
      const jobId = await jobQueue.add(
        new TestJob({
          input: { taskType: "permanent_fail", data: "no-retry" },
          maxRetries: 2, // Even with runAttempts enabled, permanent failures should not retry
        })
      );

      let error: Error | null = null;
      try {
        await jobQueue.waitFor(jobId);
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(PermanentJobError);
      expect(error?.message).toBe("Permanent failure - do not retry");

      const failedJob = await jobQueue.get(jobId);
      expect(failedJob?.status).toBe(JobStatus.FAILED);
      expect(failedJob?.error).toBe("Permanent failure - do not retry");
      expect(failedJob?.runAttempts).toBe(1); // Should not retry permanent failures

      await jobQueue.stop();
    });

    it("should emit error events when jobs fail", async () => {
      await jobQueue.start();
      let errorEventReceived = false;
      let errorEventJob: unknown;
      let errorEventError = "";

      jobQueue.on("job_error", (_queueName, jobId, error) => {
        errorEventReceived = true;
        errorEventJob = jobId;
        errorEventError = error;
      });

      const jobId = await jobQueue.add(
        new TestJob({
          input: { taskType: "failing", data: "will-fail" },
          maxRetries: 0, // Ensure no runAttempts
        })
      );

      try {
        await jobQueue.waitFor(jobId);
      } catch (error) {
        // Expected error
      }

      expect(errorEventReceived).toBe(true);
      expect(errorEventJob).toBe(jobId);
      expect(errorEventError).toContain("Job failed as expected");
    });
  });
}
