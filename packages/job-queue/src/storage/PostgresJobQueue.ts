//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { nanoid } from "nanoid";
import { makeFingerprint } from "@ellmers/util";
import { JobError, JobQueue, PermanentJobError, RetryableJobError } from "../job/JobQueue";
import { JobQueueOptions } from "job/IJobQueue";
import { Job, JobStatus } from "../job/Job";
import { Pool } from "pg";
// TODO: prepared statements

/**
 * PostgreSQL implementation of a job queue.
 * Provides storage and retrieval for job execution states using PostgreSQL.
 */
export class PostgresJobQueue<Input, Output> extends JobQueue<Input, Output> {
  constructor(
    protected readonly db: Pool,
    queue: string,
    jobClass: typeof Job<Input, Output> = Job<Input, Output>,
    options: JobQueueOptions
  ) {
    super(queue, jobClass, options);
    this.dbPromise = this.ensureTableExists();
  }

  private dbPromise: Promise<void>;

  public async ensureTableExists() {
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
      jobRunId text NOT NULL,
      status job_status NOT NULL default 'PENDING',
      input jsonb NOT NULL,
      output jsonb,
      retries integer default 0,
      maxRetries integer default 23,
      runAfter timestamp with time zone DEFAULT now(),
      lastRanAt timestamp with time zone,
      createdAt timestamp with time zone DEFAULT now(),
      deadlineAt timestamp with time zone,
      completedAt timestamp with time zone,
      error text,
      errorCode text,
      progress real DEFAULT 0,
      progressMessage text DEFAULT '',
      progressDetails jsonb
    )`;

    await this.db.query(sql);

    sql = `
      CREATE INDEX IF NOT EXISTS job_fetcher_idx 
        ON job_queue (id, status, runAfter)`;
    await this.db.query(sql);

    sql = `
      CREATE INDEX IF NOT EXISTS job_queue_fetcher_idx 
        ON job_queue (queue, status, runAfter)`;
    await this.db.query(sql);

    sql = `
      CREATE INDEX IF NOT EXISTS jobs_fingerprint_unique_idx 
        ON job_queue (queue, fingerprint, status)`;
    await this.db.query(sql);
  }

  /**
   * Creates a new job instance from the provided database results.
   * @param results - The job data from the database
   * @returns A new Job instance with populated properties
   */
  protected createNewJob(results: any, parseIO = true): Job<Input, Output> {
    const job = new this.jobClass({
      input: (parseIO ? JSON.parse(results.input) : results.input) as Input,
      output: results.output
        ? ((parseIO ? JSON.parse(results.output) : results.output) as Output)
        : null,
      runAfter: results.runafter ? new Date(results.runafter + "Z") : null,
      createdAt: new Date(results.createdat + "Z"),
      deadlineAt: results.deadlineat ? new Date(results.deadlineat + "Z") : null,
      lastRanAt: results.lastranat ? new Date(results.lastranat + "Z") : null,
      completedAt: results.completedat ? new Date(results.completedat + "Z") : null,
      progress: results.progress || 0,
      progressMessage: results.progressmessage || "",
      progressDetails: results.progressdetails ?? null,
      queueName: results.queue,
      jobRunId: results.jobrunid,
      id: results.id,
      status: results.status,
      retries: results.retries,
      maxRetries: results.maxretries,
      fingerprint: results.fingerprint,
      error: results.error,
      errorCode: results.errorcode,
    });
    job.queue = this;
    return job;
  }

  /**
   * Adds a new job to the queue.
   * @param job - The job to add
   * @returns The ID of the added job
   */
  public async add(job: Job<Input, Output>) {
    await this.dbPromise;
    job.queueName = this.queueName;
    job.jobRunId = job.jobRunId ?? nanoid();
    const fingerprint = await makeFingerprint(job.input);
    job.progress = 0;
    job.progressMessage = "";
    job.progressDetails = null;
    job.queue = this;

    const sql = `
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
        progressDetails
      )
      VALUES 
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id`;
    const params = [
      this.queueName,
      fingerprint,
      JSON.stringify(job.input),
      job.createdAt.toISOString(),
      job.deadlineAt?.toISOString() ?? null,
      job.maxRetries,
      job.jobRunId,
      job.progress,
      job.progressMessage,
      job.progressDetails ? JSON.stringify(job.progressDetails) : null,
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
    await this.dbPromise;
    const result = await this.db.query(
      `SELECT *
        FROM job_queue
        WHERE id = $1
        FOR UPDATE SKIP LOCKED
        LIMIT 1`,
      [id]
    );
    if (!result || result.rows.length === 0) return undefined;
    return this.createNewJob(result.rows[0], false);
  }

  /**
   * Retrieves a slice of jobs from the queue.
   * @param num - Maximum number of jobs to return
   * @returns An array of jobs
   */
  public async peek(status: JobStatus = JobStatus.PENDING, num: number = 100) {
    await this.dbPromise;
    num = Number(num) || 100; // TS does not validate, so ensure it is a number
    const result = await this.db.query<
      [
        string,
        string,
        string,
        JobStatus,
        string,
        string,
        number,
        number,
        string,
        string,
        string,
        string,
        string,
      ],
      [string, JobStatus, number]
    >(
      `
      SELECT *
        FROM job_queue
        WHERE queue = $1
        AND status = $2
        AND runAfter <= NOW() AT TIME ZONE 'UTC'
        ORDER BY runAfter ASC
        LIMIT $3
        FOR UPDATE SKIP LOCKED`,
      [this.queueName, status, num]
    );
    if (!result) return [];
    const ret = result.rows.map((r) => this.createNewJob(r, false));
    return ret;
  }

  /**
   * Retrieves the next available job that is ready to be processed.
   * @returns The next job or undefined if no job is available
   */
  public async next() {
    await this.dbPromise;
    const result = await this.db.query<Job<Input, Output>, [JobStatus, string, JobStatus]>(
      `
      UPDATE job_queue 
      SET status = $1, lastRanAt = NOW() AT TIME ZONE 'UTC'
      WHERE id = (
        SELECT id 
        FROM job_queue 
        WHERE queue = $2 
        AND status = $3 
        AND runAfter <= NOW() AT TIME ZONE 'UTC'
        ORDER BY runAfter ASC 
        FOR UPDATE SKIP LOCKED 
        LIMIT 1
      )
      RETURNING *`,
      [JobStatus.PROCESSING, this.queueName, JobStatus.PENDING]
    );

    return result?.rows?.[0]?.id ? this.createNewJob(result.rows[0], false) : undefined;
  }

  /**
   * Retrieves the number of jobs in the queue with a specific status.
   * @param status - The status of the jobs to count
   * @returns The count of jobs with the specified status
   */
  public async size(status = JobStatus.PENDING) {
    await this.dbPromise;
    const result = await this.db.query<{ count: string }, [string, JobStatus]>(
      `
      SELECT COUNT(*) as count
        FROM job_queue
        WHERE queue = $1
        AND status = $2
        AND runAfter <= NOW() AT TIME ZONE 'UTC'`,
      [this.queueName, status]
    );
    if (!result) return 0;
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Marks a job as complete with its output or error.
   * Enhanced error handling:
   * - For a retryable error, increments retries and updates runAfter.
   * - Marks a job as FAILED immediately for permanent or generic errors.
   */
  public async complete(id: number, output: Output | null = null, error?: JobError): Promise<void> {
    await this.dbPromise;
    const job = await this.get(id);
    if (!job) throw new Error(`Job ${id} not found`);

    this.updateJobAfterExecution(job, error, output);

    if (error && job.status === JobStatus.PENDING) {
      const result = await this.db.query(
        `
        UPDATE job_queue 
          SET 
            error = $1, 
            errorCode = $2,
            status = $3, 
            runAfter = $4, 
            progress = $5,
            progressMessage = '',
            progressDetails = NULL,
            completedAt = NOW() AT TIME ZONE 'UTC'
          WHERE id = $6 AND queue = $7`,
        [
          job.error,
          job.errorCode,
          job.status,
          job.runAfter!.toISOString(),
          job.progress,
          id,
          this.queueName,
        ]
      );
    } else {
      await this.db.query(
        `
          UPDATE job_queue 
          SET output = $1, 
              error = $2, 
              errorCode = $3,
              status = $4, 
              retries = retries + 1, 
              progress = $5,
              progressMessage = '',
              progressDetails = NULL,
              completedAt = $6
          WHERE id = $7 AND queue = $8`,
        [
          output ? JSON.stringify(output) : null,
          job.error ?? null,
          job.errorCode ?? null,
          job.status,
          job.progress,
          job.completedAt!.toISOString(),
          id,
          this.queueName,
        ]
      );
    }

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      await this.onCompleted(id, job.status, output, error);
    }
  }

  /**
   * Clears all jobs from the queue.
   */
  public async deleteAll() {
    await this.dbPromise;
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
    await this.dbPromise;
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
    await this.dbPromise;
    const result = await this.db.query(
      `
      UPDATE job_queue 
      SET status = 'ABORTING' 
      WHERE id = $1 AND queue = $2`,
      [jobId, this.queueName]
    );
    this.abortJob(jobId);
    return result.rowCount ? true : false;
  }

  /**
   * Retrieves all jobs for a given job run ID.
   * @param jobRunId - The ID of the job run to retrieve
   * @returns An array of jobs
   */
  public async getJobsByRunId(jobRunId: string) {
    await this.dbPromise;
    const result = await this.db.query(
      `
      SELECT * FROM job_queue WHERE jobRunId = $1 AND queue = $2`,
      [jobRunId, this.queueName]
    );
    if (!result) return [];
    return result.rows.map((r: any) => this.createNewJob(r, false));
  }

  /**
   * Implements the abstract saveProgress method from JobQueue
   */
  protected async saveProgress(
    jobId: unknown,
    progress: number,
    message: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.dbPromise;
    await this.db.query(
      `
      UPDATE job_queue 
      SET progress = $1,
          progressMessage = $2,
          progressDetails = $3::jsonb
      WHERE id = $4 AND queue = $5`,
      [progress, message, details as any, jobId as number, this.queueName]
    );
  }

  /**
   * Deletes a job by its ID
   */
  protected async deleteJob(jobId: unknown): Promise<void> {
    await this.dbPromise;
    await this.db.query("DELETE FROM job_queue WHERE id = $1 AND queue = $2", [
      jobId,
      this.queueName,
    ]);
  }
}
