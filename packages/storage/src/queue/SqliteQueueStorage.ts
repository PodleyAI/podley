//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { Database } from "bun:sqlite";
import { nanoid } from "nanoid";
import { makeFingerprint } from "@ellmers/util";
import { JobStatus, JobStorageFormat, IQueueStorage } from "./IQueueStorage";

/**
 * SQLite implementation of a job queue.
 * Provides storage and retrieval for job execution states using SQLite.
 */
export class SqliteQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  constructor(
    protected db: Database,
    protected queueName: string,
    protected options?: {
      deleteAfterCompletionMs?: number;
      deleteAfterFailureMs?: number;
    }
  ) {
    this.ensureTableExists();
  }

  public ensureTableExists() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_queue (
        id INTEGER PRIMARY KEY,
        fingerprint text NOT NULL,
        queue text NOT NULL,
        jobRunId text NOT NULL,
        status TEXT NOT NULL default 'PENDING',
        input TEXT NOT NULL,
        output TEXT,
        runAttempts INTEGER default 0,
        maxRetries INTEGER default 23,
        runAfter TEXT NOT NULL,
        lastRanAt TEXT,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        deadlineAt TEXT,
        error TEXT,
        errorCode TEXT,
        progress REAL DEFAULT 0,
        progressMessage TEXT DEFAULT '',
        progressDetails TEXT NULL
      );
      
      CREATE INDEX IF NOT EXISTS job_queue_fetcher_idx ON job_queue (queue, status, runAfter);
      CREATE INDEX IF NOT EXISTS job_queue_fingerprint_idx ON job_queue (queue, fingerprint, status);
      CREATE INDEX IF NOT EXISTS job_queue_jobRunId_idx ON job_queue (queue, jobRunId);
    `);
    return this;
  }

  /**
   * Adds a new job to the queue.
   * @param job - The job to add
   * @returns The ID of the added job
   */
  public async add(job: JobStorageFormat<Input, Output>) {
    const now = new Date().toISOString();
    job.jobRunId = job.jobRunId ?? nanoid();
    job.queue = this.queueName;
    job.fingerprint = await makeFingerprint(job.input);
    job.status = JobStatus.PENDING;
    job.progress = 0;
    job.progressMessage = "";
    job.progressDetails = null;
    job.createdAt = now;
    job.runAfter = now;

    const AddQuery = `
      INSERT INTO job_queue(
        queue, 
        fingerprint, 
        input, 
        runAfter, 
        deadlineAt, 
        maxRetries, 
        jobRunId, 
        progress, 
        progressMessage, 
        progressDetails,
        createdAt
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`;

    const stmt = this.db.prepare<
      { id: string },
      [
        queue: string,
        fingerprint: string,
        input: string,
        runAfter: string | null,
        deadlineAt: string | null,
        maxRetries: number,
        jobRunId: string,
        progress: number,
        progressMessage: string,
        progressDetails: string | null,
        createdAt: string,
      ]
    >(AddQuery);

    const result = stmt.get(
      job.queue,
      job.fingerprint,
      JSON.stringify(job.input),
      job.runAfter,
      job.deadlineAt ?? null,
      job.maxRetries!,
      job.jobRunId,
      job.progress,
      job.progressMessage,
      job.progressDetails ? JSON.stringify(job.progressDetails) : null,
      job.createdAt
    ) as { id: string } | undefined;

    job.id = result?.id;
    return result?.id;
  }

  /**
   * Retrieves a job by its ID.
   * @param id - The ID of the job to retrieve
   * @returns The job if found, undefined otherwise
   */
  public async get(id: string) {
    const JobQuery = `
      SELECT *
        FROM job_queue
        WHERE id = $1 AND queue = $2
        LIMIT 1`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progressDetails: string | null;
      },
      [id: string, queue: string]
    >(JobQuery);
    const result = stmt.get(id, this.queueName);
    if (!result) return undefined;

    // Parse JSON fields
    if (result.input) result.input = JSON.parse(result.input);
    if (result.output) result.output = JSON.parse(result.output);
    if (result.progressDetails) result.progressDetails = JSON.parse(result.progressDetails);
    return result;
  }

  /**
   * Retrieves a slice of jobs from the queue.
   * @param num - Maximum number of jobs to return
   * @returns An array of jobs
   */
  public async peek(status: JobStatus = JobStatus.PENDING, num: number = 100) {
    num = Number(num) || 100; // TS does not validate, so ensure it is a number since we put directly in SQL string
    const FutureJobQuery = `
      SELECT * 
        FROM job_queue
        WHERE queue = $1
        AND status = $2
        ORDER BY runAfter ASC
        LIMIT ${num}`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progressDetails: string | null;
      },
      [queue: string, status: string]
    >(FutureJobQuery);
    const result = stmt.all(this.queueName, status);
    return (result || []).map((details) => {
      // Parse JSON fields
      if (details.input) details.input = JSON.parse(details.input);
      if (details.output) details.output = JSON.parse(details.output);
      if (details.progressDetails) details.progressDetails = JSON.parse(details.progressDetails);

      return details;
    });
  }

  /**
   * Aborts a job by setting its status to "ABORTING".
   * This method will signal the corresponding AbortController so that
   * the job's execute() method (if it supports an AbortSignal parameter)
   * can clean up and exit.
   */
  public async abort(jobId: string) {
    const AbortQuery = `
      UPDATE job_queue
        SET status = $1
        WHERE id = $2 AND queue = $3`;
    const stmt = this.db.prepare(AbortQuery);
    stmt.run(JobStatus.ABORTING, jobId, this.queueName);
  }

  /**
   * Retrieves all jobs for a given job run ID.
   * @param jobRunId - The ID of the job run to retrieve
   * @returns An array of jobs
   */
  public async getByRunId(jobRunId: string) {
    const JobsByRunIdQuery = `
      SELECT *
        FROM job_queue
        WHERE jobRunId = $1 AND queue = $2`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progressDetails: string | null;
      },
      [jobRunId: string, queue: string]
    >(JobsByRunIdQuery);
    const result = stmt.all(jobRunId, this.queueName);
    return (result || []).map((details) => {
      // Parse JSON fields
      if (details.input) details.input = JSON.parse(details.input);
      if (details.output) details.output = JSON.parse(details.output);
      if (details.progressDetails) details.progressDetails = JSON.parse(details.progressDetails);

      return details;
    });
  }

  /**
   * Retrieves the next available job that is ready to be processed,
   * and updates its status to PROCESSING.
   *
   * @returns The next job or undefined if no job is available
   */
  public async next() {
    const now = new Date().toISOString();

    // Then, get the next job to process
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progressDetails: string | null;
      },
      [JobStatus, string, string, JobStatus, string]
    >(
      `
      UPDATE job_queue 
      SET status = $1, lastRanAt = $2
      WHERE id = (
        SELECT id 
        FROM job_queue 
        WHERE queue = $3 
        AND status = $4 
        AND runAfter <= $5 
        ORDER BY runAfter ASC 
        LIMIT 1
      )
      RETURNING *`
    );
    const result = stmt.get(JobStatus.PROCESSING, now, this.queueName, JobStatus.PENDING, now);
    if (!result) return undefined;

    // Parse JSON fields
    if (result.input) result.input = JSON.parse(result.input);
    if (result.output) result.output = JSON.parse(result.output);
    if (result.progressDetails) result.progressDetails = JSON.parse(result.progressDetails);

    return result;
  }

  /**
   * Retrieves the number of jobs in the queue with a specific status.
   * @param status - The status of the jobs to count
   * @returns The count of jobs with the specified status
   */
  public async size(status = JobStatus.PENDING) {
    const sizeQuery = `
      SELECT COUNT(*) as count
        FROM job_queue
        WHERE queue = $1
        AND status = $2`;
    const stmt = this.db.prepare<{ count: number }, [queue: string, status: string]>(sizeQuery);
    const result = stmt.get(this.queueName, status) as any;
    return result.count;
  }

  /**
   * Marks a job as complete with its output or error.
   * Enhanced error handling:
   * - Increments the retry count.
   * - For a retryable error, updates runAfter with the retry date.
   * - Marks the job as FAILED for permanent or generic errors.
   */
  public async complete(job: JobStorageFormat<Input, Output>) {
    const now = new Date().toISOString();
    let updateQuery: string;
    let params: any[];
    if (job.status === JobStatus.PENDING) {
      updateQuery = `
          UPDATE job_queue 
            SET 
              error = ?, 
              errorCode = ?, 
              status = ?, 
              runAfter = ?, 
              lastRanAt = ?,
              progress = 0, 
              progressMessage = "", 
              progressDetails = NULL, 
              runAttempts = runAttempts + 1,
              lastRanAt = ?
            WHERE id = ? AND queue = ?`;
      params = [
        job.error ?? null,
        job.errorCode ?? null,
        job.status,
        job.runAfter,
        now,
        job.status,
        job.id,
        this.queueName,
      ];
    } else {
      updateQuery = `
          UPDATE job_queue 
            SET 
              output = ?, 
              error = ?, 
              errorCode = ?, 
              status = ?, 
              progress = 100, 
              progressMessage = "", 
              progressDetails = NULL, 
              lastRanAt = ?,
              completedAt = ?,
              runAttempts = runAttempts + 1
            WHERE id = ? AND queue = ?`;
      params = [
        job.output ? JSON.stringify(job.output) : null,
        job.error ?? null,
        job.errorCode ?? null,
        job.status,
        now,
        now,
        job.id,
        this.queueName,
      ];
    }
    const stmt = this.db.prepare(updateQuery);
    stmt.run(...params);
  }

  public async deleteAll() {
    const ClearQuery = `
      DELETE FROM job_queue
        WHERE queue = ?`;
    const stmt = this.db.prepare(ClearQuery);
    stmt.run(this.queueName);
  }

  /**
   * Looks up cached output for a  input
   * Uses input fingerprinting for efficient matching
   * @returns The cached output or null if not found
   */
  public async outputForInput(input: Input) {
    const fingerprint = await makeFingerprint(input);
    const OutputQuery = `
      SELECT output
        FROM job_queue
        WHERE queue = ? AND fingerprint = ? AND status = ?`;
    const stmt = this.db.prepare<
      { output: string },
      [queue: string, fingerprint: string, status: string]
    >(OutputQuery);
    const result = stmt.get(this.queueName, fingerprint, JobStatus.COMPLETED);
    return result?.output ? JSON.parse(result.output) : null;
  }

  /**
   * Implements the abstract saveProgress method from JobQueue
   */
  public async saveProgress(
    jobId: unknown,
    progress: number,
    message: string,
    details: Record<string, any>
  ): Promise<void> {
    const UpdateProgressQuery = `
      UPDATE job_queue
        SET progress = ?,
            progressMessage = ?,
            progressDetails = ?
        WHERE id = ? AND queue = ?`;

    const stmt = this.db.prepare(UpdateProgressQuery);
    stmt.run(progress, message, JSON.stringify(details), String(jobId), this.queueName);
  }

  /**
   * Deletes a job by its ID
   */
  public async delete(jobId: unknown): Promise<void> {
    const DeleteQuery = `
      DELETE FROM job_queue
        WHERE id = ? AND queue = ?`;
    const stmt = this.db.prepare(DeleteQuery);
    stmt.run(String(jobId), this.queueName);
  }

  /**
   * Delete jobs with a specific status older than a cutoff date
   * @param status - Status of jobs to delete
   * @param olderThanMs - Delete jobs completed more than this many milliseconds ago
   */
  public async deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();
    const DeleteQuery = `
      DELETE FROM job_queue
        WHERE queue = ?
        AND status = ?
        AND completedAt IS NOT NULL
        AND completedAt <= ?`;
    const stmt = this.db.prepare(DeleteQuery);
    stmt.run(this.queueName, status, cutoffDate);
  }
}
