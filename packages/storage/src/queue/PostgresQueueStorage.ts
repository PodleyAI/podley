/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, makeFingerprint, uuid4 } from "@workglow/util";
import { Pool } from "pg";
import { IQueueStorage, JobStatus, JobStorageFormat } from "./IQueueStorage";

export const POSTGRES_QUEUE_STORAGE = createServiceToken<IQueueStorage<any, any>>(
  "jobqueue.storage.postgres"
);

// TODO: prepared statements

/**
 * PostgreSQL implementation of a job queue.
 * Provides storage and retrieval for job execution states using PostgreSQL.
 */
export class PostgresQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  constructor(
    protected readonly db: Pool,
    protected readonly queueName: string
  ) {}

  public async setupDatabase(): Promise<void> {
    let sql: string;
    try {
      sql = `CREATE TYPE job_status AS ENUM (${Object.values(JobStatus)
        .map((v) => `'${v}'`)
        .join(",")})`;
      await this.db.query(sql);
    } catch (e: any) {
      // Ignore error if type already exists (code 42710)
      if (e.code !== "42710") throw e;
    }

    sql = `
    CREATE TABLE IF NOT EXISTS job_queue (
      id SERIAL NOT NULL,
      fingerprint text NOT NULL,
      queue text NOT NULL,
      job_run_id text NOT NULL,
      status job_status NOT NULL default 'PENDING',
      input jsonb NOT NULL,
      output jsonb,
      run_attempts integer default 0,
      max_retries integer default 20,
      run_after timestamp with time zone DEFAULT now(),
      last_ran_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      deadline_at timestamp with time zone,
      completed_at timestamp with time zone,
      error text,
      error_code text,
      progress real DEFAULT 0,
      progress_message text DEFAULT '',
      progress_details jsonb
    )`;

    await this.db.query(sql);

    sql = `
      CREATE INDEX IF NOT EXISTS job_fetcher_idx 
        ON job_queue (id, status, run_after)`;
    await this.db.query(sql);

    sql = `
      CREATE INDEX IF NOT EXISTS job_queue_fetcher_idx 
        ON job_queue (queue, status, run_after)`;
    await this.db.query(sql);

    sql = `
      CREATE INDEX IF NOT EXISTS jobs_fingerprint_unique_idx 
        ON job_queue (queue, fingerprint, status)`;
    await this.db.query(sql);
  }

  /**
   * Adds a new job to the queue.
   * @param job - The job to add
   * @returns The ID of the added job
   */
  public async add(job: JobStorageFormat<Input, Output>) {
    const now = new Date().toISOString();
    job.queue = this.queueName;
    job.job_run_id = job.job_run_id ?? uuid4();
    job.fingerprint = await makeFingerprint(job.input);
    job.status = JobStatus.PENDING;
    job.progress = 0;
    job.progress_message = "";
    job.progress_details = null;
    job.created_at = now;
    job.run_after = now;

    const sql = `
      INSERT INTO job_queue(
        queue, 
        fingerprint, 
        input, 
        run_after,
        created_at,
        deadline_at,
        max_retries, 
        job_run_id, 
        progress, 
        progress_message, 
        progress_details
      )
      VALUES 
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id`;
    const params = [
      job.queue,
      job.fingerprint,
      JSON.stringify(job.input),
      job.run_after,
      job.created_at,
      job.deadline_at,
      job.max_retries,
      job.job_run_id,
      job.progress,
      job.progress_message,
      job.progress_details ? JSON.stringify(job.progress_details) : null,
    ];
    const result = await this.db.query(sql, params);

    if (!result) throw new Error("Failed to add to queue");
    job.id = result.rows[0].id;
    return job.id;
  }

  /**
   * Retrieves a job by its ID.
   * @param id - The ID of the job to retrieve
   * @returns The job if found, undefined otherwise
   */
  public async get(id: number) {
    const result = await this.db.query(
      `SELECT *
        FROM job_queue
        WHERE id = $1 AND queue = $2
        FOR UPDATE SKIP LOCKED
        LIMIT 1`,
      [id, this.queueName]
    );

    if (!result || result.rows.length === 0) return undefined;
    return result.rows[0];
  }

  /**
   * Retrieves a slice of jobs from the queue.
   * @param num - Maximum number of jobs to return
   * @returns An array of jobs
   */
  public async peek(status: JobStatus = JobStatus.PENDING, num: number = 100) {
    num = Number(num) || 100; // TS does not validate, so ensure it is a number
    const result = await this.db.query<
      JobStorageFormat<Input, Output>,
      [string, JobStatus, number]
    >(
      `
      SELECT *
        FROM job_queue
        WHERE queue = $1
        AND status = $2
        ORDER BY run_after ASC
        LIMIT $3
        FOR UPDATE SKIP LOCKED`,
      [this.queueName, status, num]
    );
    if (!result) return [];
    return result.rows;
  }

  /**
   * Retrieves the next available job that is ready to be processed.
   * @returns The next job or undefined if no job is available
   */
  public async next() {
    const result = await this.db.query<
      JobStorageFormat<Input, Output>,
      [JobStatus, string, JobStatus]
    >(
      `
      UPDATE job_queue 
      SET status = $1, last_ran_at = NOW() AT TIME ZONE 'UTC'
      WHERE id = (
        SELECT id 
        FROM job_queue 
        WHERE queue = $2 
        AND status = $3 
        AND run_after <= NOW() AT TIME ZONE 'UTC'
        ORDER BY run_after ASC 
        FOR UPDATE SKIP LOCKED 
        LIMIT 1
      )
      RETURNING *`,
      [JobStatus.PROCESSING, this.queueName, JobStatus.PENDING]
    );

    return result?.rows?.[0] ?? undefined;
  }

  /**
   * Retrieves the number of jobs in the queue with a specific status.
   * @param status - The status of the jobs to count
   * @returns The count of jobs with the specified status
   */
  public async size(status = JobStatus.PENDING) {
    const result = await this.db.query<{ count: string }, [string, JobStatus]>(
      `
      SELECT COUNT(*) as count
        FROM job_queue
        WHERE queue = $1
        AND status = $2`,
      [this.queueName, status]
    );
    if (!result) return 0;
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Marks a job as complete with its output or error.
   * Enhanced error handling:
   * - For a retryable error, increments run_attempts and updates run_after.
   * - Marks a job as FAILED immediately for permanent or generic errors.
   */
  public async complete(jobDetails: JobStorageFormat<Input, Output>): Promise<void> {
    if (jobDetails.status === JobStatus.DISABLED) {
      await this.db.query(
        `UPDATE job_queue 
          SET 
            status = $1, 
            progress = 100,
            progress_message = '',
            progress_details = NULL,
            completed_at = NOW() AT TIME ZONE 'UTC'
          WHERE id = $2 AND queue = $3`,
        [jobDetails.status, jobDetails.id, this.queueName]
      );
    } else if (jobDetails.status === JobStatus.PENDING) {
      await this.db.query(
        `UPDATE job_queue 
          SET 
            error = $1, 
            error_code = $2,
            status = $3, 
            run_after = $4, 
            progress = 0,
            progress_message = '',
            progress_details = NULL,
            run_attempts = run_attempts + 1, 
            last_ran_at = NOW() AT TIME ZONE 'UTC'
          WHERE id = $5 AND queue = $6`,
        [
          jobDetails.error,
          jobDetails.error_code,
          jobDetails.status,
          jobDetails.run_after,
          jobDetails.id,
          this.queueName,
        ]
      );
    } else {
      await this.db.query(
        `
          UPDATE job_queue 
            SET 
              output = $1, 
              error = $2, 
              error_code = $3,
              status = $4, 
              progress = 100,
              progress_message = '',
              progress_details = NULL,
              run_attempts = run_attempts + 1, 
              completed_at = NOW() AT TIME ZONE 'UTC',
              last_ran_at = NOW() AT TIME ZONE 'UTC'
          WHERE id = $5 AND queue = $6`,
        [
          jobDetails.output ? JSON.stringify(jobDetails.output) : null,
          jobDetails.error ?? null,
          jobDetails.error_code ?? null,
          jobDetails.status,
          jobDetails.id,
          this.queueName,
        ]
      );
    }
  }

  /**
   * Clears all jobs from the queue.
   */
  public async deleteAll() {
    await this.db.query(
      `
      DELETE FROM job_queue
        WHERE queue = $1`,
      [this.queueName]
    );
  }

  /**
   * Looks up cached output for a given input
   * Uses input fingerprinting for efficient matching
   * @returns The cached output or null if not found
   */
  public async outputForInput(input: Input) {
    const fingerprint = await makeFingerprint(input);
    const result = await this.db.query(
      `
      SELECT output
        FROM job_queue
        WHERE fingerprint = $1 AND queue = $2 AND status = 'COMPLETED'`,
      [fingerprint, this.queueName]
    );
    if (!result) return null;
    return result.rows[0].output;
  }

  /**
   * Aborts a job by setting its status to "ABORTING".
   * This method will signal the corresponding AbortController so that
   * the job's execute() method (if it supports an AbortSignal parameter)
   * can clean up and exit.
   */
  public async abort(jobId: number) {
    const result = await this.db.query(
      `
      UPDATE job_queue 
      SET status = 'ABORTING' 
      WHERE id = $1 AND queue = $2`,
      [jobId, this.queueName]
    );
  }

  /**
   * Retrieves all jobs for a given job run ID.
   * @param job_run_id - The ID of the job run to retrieve
   * @returns An array of jobs
   */
  public async getByRunId(job_run_id: string) {
    const result = await this.db.query(
      `
      SELECT * FROM job_queue WHERE job_run_id = $1 AND queue = $2`,
      [job_run_id, this.queueName]
    );
    if (!result) return [];
    return result.rows;
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
    await this.db.query(
      `
      UPDATE job_queue 
      SET progress = $1,
          progress_message = $2,
          progress_details = $3
      WHERE id = $4 AND queue = $5`,
      [progress, message, details ? JSON.stringify(details) : null, jobId as number, this.queueName]
    );
  }

  /**
   * Deletes a job by its ID
   */
  public async delete(jobId: unknown): Promise<void> {
    await this.db.query("DELETE FROM job_queue WHERE id = $1 AND queue = $2", [
      jobId,
      this.queueName,
    ]);
  }

  /**
   * Delete jobs with a specific status older than a cutoff date
   * @param status - Status of jobs to delete
   * @param olderThanMs - Delete jobs completed more than this many milliseconds ago
   */
  public async deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();
    await this.db.query(
      `DELETE FROM job_queue 
       WHERE queue = $1 
       AND status = $2 
       AND completed_at IS NOT NULL 
       AND completed_at <= $3`,
      [this.queueName, status, cutoffDate]
    );
  }
}
