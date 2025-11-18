/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Sqlite } from "@podley/sqlite";
import { createServiceToken, makeFingerprint, sleep, uuid4 } from "@podley/util";
import { IQueueStorage, JobStatus, JobStorageFormat } from "./IQueueStorage";

export const SQLITE_QUEUE_STORAGE =
  createServiceToken<IQueueStorage<any, any>>("jobqueue.storage.sqlite");

/**
 * SQLite implementation of a job queue.
 * Provides storage and retrieval for job execution states using SQLite.
 */
export class SqliteQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  constructor(
    protected db: Sqlite.Database,
    protected queueName: string,
    protected options?: {
      deleteAfterCompletionMs?: number;
      deleteAfterFailureMs?: number;
    }
  ) {}

  public async setupDatabase(): Promise<void> {
    await sleep(0);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_queue (
        id INTEGER PRIMARY KEY,
        fingerprint text NOT NULL,
        queue text NOT NULL,
        job_run_id text NOT NULL,
        status TEXT NOT NULL default 'PENDING',
        input TEXT NOT NULL,
        output TEXT,
        run_attempts INTEGER default 0,
        max_retries INTEGER default 23,
        run_after TEXT NOT NULL,
        last_ran_at TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        deadline_at TEXT,
        error TEXT,
        error_code TEXT,
        progress REAL DEFAULT 0,
        progress_message TEXT DEFAULT '',
        progress_details TEXT NULL
      );
      
      CREATE INDEX IF NOT EXISTS job_queue_fetcher_idx ON job_queue (queue, status, run_after);
      CREATE INDEX IF NOT EXISTS job_queue_fingerprint_idx ON job_queue (queue, fingerprint, status);
      CREATE INDEX IF NOT EXISTS job_queue_job_run_id_idx ON job_queue (queue, job_run_id);
    `);
  }

  /**
   * Adds a new job to the queue.
   * @param job - The job to add
   * @returns The ID of the added job
   */
  public async add(job: JobStorageFormat<Input, Output>) {
    const now = new Date().toISOString();
    job.job_run_id = job.job_run_id ?? uuid4();
    job.queue = this.queueName;
    job.fingerprint = await makeFingerprint(job.input);
    job.status = JobStatus.PENDING;
    job.progress = 0;
    job.progress_message = "";
    job.progress_details = null;
    job.created_at = now;
    job.run_after = now;

    const AddQuery = `
      INSERT INTO job_queue(
        queue, 
        fingerprint, 
        input, 
        run_after, 
        deadline_at, 
        max_retries, 
        job_run_id, 
        progress, 
        progress_message, 
        progress_details,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id`;

    const stmt = this.db.prepare<
      { id: string },
      [
        queue: string,
        fingerprint: string,
        input: string,
        run_after: string | null,
        deadline_at: string | null,
        max_retries: number,
        job_run_id: string,
        progress: number,
        progress_message: string,
        progress_details: string | null,
        created_at: string,
      ]
    >(AddQuery);

    const result = stmt.get(
      job.queue,
      job.fingerprint,
      JSON.stringify(job.input),
      job.run_after,
      job.deadline_at ?? null,
      job.max_retries!,
      job.job_run_id,
      job.progress,
      job.progress_message,
      job.progress_details ? JSON.stringify(job.progress_details) : null,
      job.created_at
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
        WHERE id = ? AND queue = ?
        LIMIT 1`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      [id: string, queue: string]
    >(JobQuery);
    const result = stmt.get(id, this.queueName);
    if (!result) return undefined;

    // Parse JSON fields
    if (result.input) result.input = JSON.parse(result.input);
    if (result.output) result.output = JSON.parse(result.output);
    if (result.progress_details) result.progress_details = JSON.parse(result.progress_details);
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
        WHERE queue = ?
        AND status = ?
        ORDER BY run_after ASC
        LIMIT ${num}`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      [queue: string, status: string]
    >(FutureJobQuery);
    const result = stmt.all(this.queueName, status);
    return (result || []).map((details) => {
      // Parse JSON fields
      if (details.input) details.input = JSON.parse(details.input);
      if (details.output) details.output = JSON.parse(details.output);
      if (details.progress_details) details.progress_details = JSON.parse(details.progress_details);

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
        SET status = ?  
        WHERE id = ? AND queue = ?`;
    const stmt = this.db.prepare(AbortQuery);
    stmt.run(JobStatus.ABORTING, jobId, this.queueName);
  }

  /**
   * Retrieves all jobs for a given job run ID.
   * @param job_run_id - The ID of the job run to retrieve
   * @returns An array of jobs
   */
  public async getByRunId(job_run_id: string) {
    const JobsByRunIdQuery = `
      SELECT *
        FROM job_queue
        WHERE job_run_id = ? AND queue = ?`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      [job_run_id: string, queue: string]
    >(JobsByRunIdQuery);
    const result = stmt.all(job_run_id, this.queueName);
    return (result || []).map((details) => {
      // Parse JSON fields
      if (details.input) details.input = JSON.parse(details.input);
      if (details.output) details.output = JSON.parse(details.output);
      if (details.progress_details) details.progress_details = JSON.parse(details.progress_details);

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
        progress_details: string | null;
      },
      [JobStatus, string, string, JobStatus, string]
    >(
      `
      UPDATE job_queue 
      SET status = ?, last_ran_at = ?
      WHERE id = (
        SELECT id 
        FROM job_queue 
        WHERE queue = ? 
        AND status = ? 
        AND run_after <= ? 
        ORDER BY run_after ASC 
        LIMIT 1
      )
      RETURNING *`
    );
    const result = stmt.get(JobStatus.PROCESSING, now, this.queueName, JobStatus.PENDING, now);
    if (!result) return undefined;

    // Parse JSON fields
    if (result.input) result.input = JSON.parse(result.input);
    if (result.output) result.output = JSON.parse(result.output);
    if (result.progress_details) result.progress_details = JSON.parse(result.progress_details);

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
        WHERE queue = ?
        AND status = ?`;
    const stmt = this.db.prepare<{ count: number }, [queue: string, status: string]>(sizeQuery);
    const result = stmt.get(this.queueName, status) as any;
    return result.count;
  }

  /**
   * Marks a job as complete with its output or error.
   * Enhanced error handling:
   * - Increments the retry count.
   * - For a retryable error, updates run_after with the retry date.
   * - Marks the job as FAILED for permanent or generic errors.
   * - Marks the job as SKIPPED for skipped jobs.
   */
  public async complete(job: JobStorageFormat<Input, Output>) {
    const now = new Date().toISOString();
    let updateQuery: string;
    let params: any[];
    if (job.status === JobStatus.SKIPPED) {
      updateQuery = `
          UPDATE job_queue 
            SET 
              status = ?, 
              progress = 100, 
              progress_message = '', 
              progress_details = NULL, 
              completed_at = ?  
            WHERE id = ? AND queue = ?`;
      params = [job.status, now, job.id, this.queueName];
    } else {
      updateQuery = `
          UPDATE job_queue 
            SET 
              output = ?, 
              error = ?, 
              error_code = ?, 
              status = ?, 
              progress = 100, 
              progress_message = '', 
              progress_details = NULL, 
              last_ran_at = ?,
              completed_at = ?,
              run_attempts = run_attempts + 1
            WHERE id = ? AND queue = ?`;
      params = [
        job.output ? JSON.stringify(job.output) : null,
        job.error ?? null,
        job.error_code ?? null,
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
            progress_message = ?,
            progress_details = ?
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
        AND completed_at IS NOT NULL
        AND completed_at <= ?`;
    const stmt = this.db.prepare(DeleteQuery);
    stmt.run(this.queueName, status, cutoffDate);
  }
}
