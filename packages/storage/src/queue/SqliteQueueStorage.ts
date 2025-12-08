/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Sqlite } from "@workglow/sqlite";
import { createServiceToken, makeFingerprint, sleep, uuid4 } from "@workglow/util";
import { PollingSubscriptionManager } from "../util/PollingSubscriptionManager";
import {
  IQueueStorage,
  JobStatus,
  JobStorageFormat,
  PrefixColumn,
  QueueChangePayload,
  QueueStorageOptions,
  QueueSubscribeOptions,
} from "./IQueueStorage";

export const SQLITE_QUEUE_STORAGE =
  createServiceToken<IQueueStorage<any, any>>("jobqueue.storage.sqlite");

/**
 * Extended options for SQLite queue storage including prefix support
 */
export interface SqliteQueueStorageOptions extends QueueStorageOptions {
  readonly deleteAfterCompletionMs?: number;
  readonly deleteAfterFailureMs?: number;
}

/**
 * SQLite implementation of a job queue.
 * Provides storage and retrieval for job execution states using SQLite.
 */
export class SqliteQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  /** The prefix column definitions */
  protected readonly prefixes: readonly PrefixColumn[];
  /** The prefix values for filtering */
  protected readonly prefixValues: Readonly<Record<string, string | number>>;
  /** The table name for the job queue */
  protected readonly tableName: string;
  /** Shared polling subscription manager */
  private pollingManager: PollingSubscriptionManager<
    JobStorageFormat<Input, Output>,
    unknown,
    QueueChangePayload<Input, Output>
  > | null = null;

  constructor(
    protected db: Sqlite.Database,
    protected queueName: string,
    protected options?: SqliteQueueStorageOptions
  ) {
    this.prefixes = options?.prefixes ?? [];
    this.prefixValues = options?.prefixValues ?? {};
    // Generate table name based on prefix configuration to avoid column conflicts
    if (this.prefixes.length > 0) {
      const prefixNames = this.prefixes.map((p) => p.name).join("_");
      this.tableName = `job_queue_${prefixNames}`;
    } else {
      this.tableName = "job_queue";
    }
  }

  /**
   * Gets the SQL column type for a prefix column (SQLite uses TEXT for uuid)
   */
  private getPrefixColumnType(type: PrefixColumn["type"]): string {
    return type === "uuid" ? "TEXT" : "INTEGER";
  }

  /**
   * Builds the prefix columns SQL for CREATE TABLE
   */
  private buildPrefixColumnsSql(): string {
    if (this.prefixes.length === 0) return "";
    return (
      this.prefixes
        .map((p) => `${p.name} ${this.getPrefixColumnType(p.type)} NOT NULL`)
        .join(",\n        ") + ",\n        "
    );
  }

  /**
   * Builds prefix column names for use in queries
   */
  private getPrefixColumnNames(): string[] {
    return this.prefixes.map((p) => p.name);
  }

  /**
   * Builds WHERE clause conditions for prefix filtering
   * @returns The conditions string with placeholders
   */
  private buildPrefixWhereClause(): string {
    if (this.prefixes.length === 0) {
      return "";
    }
    const conditions = this.prefixes.map((p) => `${p.name} = ?`).join(" AND ");
    return " AND " + conditions;
  }

  /**
   * Gets prefix values as an array in column order
   */
  private getPrefixParamValues(): Array<string | number> {
    return this.prefixes.map((p) => this.prefixValues[p.name]);
  }

  public async setupDatabase(): Promise<void> {
    await sleep(0);
    const prefixColumnsSql = this.buildPrefixColumnsSql();
    const prefixColumnNames = this.getPrefixColumnNames();
    const prefixIndexPrefix =
      prefixColumnNames.length > 0 ? prefixColumnNames.join(", ") + ", " : "";
    const indexSuffix = prefixColumnNames.length > 0 ? "_" + prefixColumnNames.join("_") : "";

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY,
        ${prefixColumnsSql}fingerprint text NOT NULL,
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
        progress_details TEXT NULL,
        worker_id TEXT
      );
      
      CREATE INDEX IF NOT EXISTS job_queue_fetcher${indexSuffix}_idx ON ${this.tableName} (${prefixIndexPrefix}queue, status, run_after);
      CREATE INDEX IF NOT EXISTS job_queue_fingerprint${indexSuffix}_idx ON ${this.tableName} (${prefixIndexPrefix}queue, fingerprint, status);
      CREATE INDEX IF NOT EXISTS job_queue_job_run_id${indexSuffix}_idx ON ${this.tableName} (${prefixIndexPrefix}queue, job_run_id);
    `);
  }

  /**
   * Adds a new job to the queue.
   * @param job - The job to add
   * @returns The ID of the added job
   */
  public async add(job: JobStorageFormat<Input, Output>): Promise<unknown> {
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

    const prefixColumnNames = this.getPrefixColumnNames();
    const prefixColumnsInsert =
      prefixColumnNames.length > 0 ? prefixColumnNames.join(", ") + ", " : "";
    const prefixPlaceholders =
      prefixColumnNames.length > 0 ? prefixColumnNames.map(() => "?").join(", ") + ", " : "";
    const prefixParamValues = this.getPrefixParamValues();

    const AddQuery = `
      INSERT INTO ${this.tableName}(
        ${prefixColumnsInsert}queue, 
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
      VALUES (${prefixPlaceholders}?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id`;

    const stmt = this.db.prepare<{ id: string }, Array<string | number | null>>(AddQuery);

    const result = stmt.get(
      ...prefixParamValues,
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
  public async get(id: unknown): Promise<JobStorageFormat<Input, Output> | undefined> {
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const JobQuery = `
      SELECT *
        FROM ${this.tableName}
        WHERE id = ? AND queue = ?${prefixConditions}
        LIMIT 1`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      Array<string | number>
    >(JobQuery);
    const result = stmt.get(String(id), this.queueName, ...prefixParams);
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
  public async peek(
    status: JobStatus = JobStatus.PENDING,
    num: number = 100
  ): Promise<Array<JobStorageFormat<Input, Output>>> {
    num = Number(num) || 100; // TS does not validate, so ensure it is a number since we put directly in SQL string
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const FutureJobQuery = `
      SELECT * 
        FROM ${this.tableName}
        WHERE queue = ?
        AND status = ?${prefixConditions}
        ORDER BY run_after ASC
        LIMIT ${num}`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      Array<string | number>
    >(FutureJobQuery);
    const result = stmt.all(this.queueName, status, ...prefixParams);
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
  public async abort(jobId: unknown): Promise<void> {
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const AbortQuery = `
      UPDATE ${this.tableName}
        SET status = ?  
        WHERE id = ? AND queue = ?${prefixConditions}`;
    const stmt = this.db.prepare(AbortQuery);
    stmt.run(JobStatus.ABORTING, String(jobId), this.queueName, ...prefixParams);
  }

  /**
   * Retrieves all jobs for a given job run ID.
   * @param job_run_id - The ID of the job run to retrieve
   * @returns An array of jobs
   */
  public async getByRunId(job_run_id: string): Promise<Array<JobStorageFormat<Input, Output>>> {
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const JobsByRunIdQuery = `
      SELECT *
        FROM ${this.tableName}
        WHERE job_run_id = ? AND queue = ?${prefixConditions}`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      Array<string | number>
    >(JobsByRunIdQuery);
    const result = stmt.all(job_run_id, this.queueName, ...prefixParams);
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
   * @param workerId - Optional worker ID to associate with the job
   * @returns The next job or undefined if no job is available
   */
  public async next(workerId?: string): Promise<JobStorageFormat<Input, Output> | undefined> {
    const now = new Date().toISOString();
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    // Then, get the next job to process
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      Array<string | number | JobStatus | null>
    >(
      `
      UPDATE ${this.tableName} 
      SET status = ?, last_ran_at = ?, worker_id = ?
      WHERE id = (
        SELECT id 
        FROM ${this.tableName} 
        WHERE queue = ? 
        AND status = ?${prefixConditions}
        AND run_after <= ? 
        ORDER BY run_after ASC 
        LIMIT 1
      )
      RETURNING *`
    );
    const result = stmt.get(
      JobStatus.PROCESSING,
      now,
      workerId ?? null,
      this.queueName,
      JobStatus.PENDING,
      ...prefixParams,
      now
    );
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
  public async size(status = JobStatus.PENDING): Promise<number> {
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const sizeQuery = `
      SELECT COUNT(*) as count
        FROM ${this.tableName}
        WHERE queue = ?
        AND status = ?${prefixConditions}`;
    const stmt = this.db.prepare<{ count: number }, Array<string | number>>(sizeQuery);
    const result = stmt.get(this.queueName, status, ...prefixParams) as any;
    return result.count;
  }

  /**
   * Marks a job as complete with its output or error.
   * Enhanced error handling:
   * - Increments the retry count.
   * - For a retryable error, updates run_after with the retry date.
   * - Marks the job as FAILED for permanent or generic errors.
   * - Marks the job as DISABLED for disabled jobs.
   */
  public async complete(job: JobStorageFormat<Input, Output>): Promise<void> {
    const now = new Date().toISOString();
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    let updateQuery: string;
    let params: Array<string | number | null>;
    if (job.status === JobStatus.DISABLED) {
      updateQuery = `
          UPDATE ${this.tableName} 
            SET 
              status = ?, 
              progress = 100, 
              progress_message = '', 
              progress_details = NULL, 
              completed_at = ?  
            WHERE id = ? AND queue = ?${prefixConditions}`;
      params = [job.status, now, job.id as string, this.queueName, ...prefixParams];
    } else {
      updateQuery = `
          UPDATE ${this.tableName} 
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
            WHERE id = ? AND queue = ?${prefixConditions}`;
      params = [
        job.output ? JSON.stringify(job.output) : null,
        job.error ?? null,
        job.error_code ?? null,
        job.status!,
        now,
        now,
        job.id as string,
        this.queueName,
        ...prefixParams,
      ];
    }
    const stmt = this.db.prepare(updateQuery);
    stmt.run(...params);
  }

  public async deleteAll(): Promise<void> {
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const ClearQuery = `
      DELETE FROM ${this.tableName}
        WHERE queue = ?${prefixConditions}`;
    const stmt = this.db.prepare(ClearQuery);
    stmt.run(this.queueName, ...prefixParams);
  }

  /**
   * Looks up cached output for a given input
   * Uses input fingerprinting for efficient matching
   * @returns The cached output or null if not found
   */
  public async outputForInput(input: Input): Promise<Output | null> {
    const fingerprint = await makeFingerprint(input);
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const OutputQuery = `
      SELECT output
        FROM ${this.tableName}
        WHERE queue = ? AND fingerprint = ? AND status = ?${prefixConditions}`;
    const stmt = this.db.prepare<{ output: string }, Array<string | number>>(OutputQuery);
    const result = stmt.get(this.queueName, fingerprint, JobStatus.COMPLETED, ...prefixParams);
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
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const UpdateProgressQuery = `
      UPDATE ${this.tableName}
        SET progress = ?,
            progress_message = ?,
            progress_details = ?
        WHERE id = ? AND queue = ?${prefixConditions}`;

    const stmt = this.db.prepare(UpdateProgressQuery);
    stmt.run(
      progress,
      message,
      JSON.stringify(details),
      String(jobId),
      this.queueName,
      ...prefixParams
    );
  }

  /**
   * Deletes a job by its ID
   */
  public async delete(jobId: unknown): Promise<void> {
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const DeleteQuery = `
      DELETE FROM ${this.tableName}
        WHERE id = ? AND queue = ?${prefixConditions}`;
    const stmt = this.db.prepare(DeleteQuery);
    stmt.run(String(jobId), this.queueName, ...prefixParams);
  }

  /**
   * Delete jobs with a specific status older than a cutoff date
   * @param status - Status of jobs to delete
   * @param olderThanMs - Delete jobs completed more than this many milliseconds ago
   */
  public async deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const DeleteQuery = `
      DELETE FROM ${this.tableName}
        WHERE queue = ?
        AND status = ?
        AND completed_at IS NOT NULL
        AND completed_at <= ?${prefixConditions}`;
    const stmt = this.db.prepare(DeleteQuery);
    stmt.run(this.queueName, status, cutoffDate, ...prefixParams);
  }

  /**
   * Gets all jobs from the queue that match the current prefix values.
   * Used internally for normal polling-based subscriptions (efficient - filters at DB level).
   *
   * @returns An array of jobs
   */
  private getAllJobs(): Array<JobStorageFormat<Input, Output>> {
    const prefixConditions = this.buildPrefixWhereClause();
    const prefixParams = this.getPrefixParamValues();

    const AllJobsQuery = `
      SELECT *
        FROM ${this.tableName}
        WHERE queue = ?${prefixConditions}`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      Array<string | number>
    >(AllJobsQuery);
    const result = stmt.all(this.queueName, ...prefixParams);
    return (result || []).map((details) => {
      // Parse JSON fields
      if (details.input) details.input = JSON.parse(details.input);
      if (details.output) details.output = JSON.parse(details.output);
      if (details.progress_details) details.progress_details = JSON.parse(details.progress_details);
      return details;
    });
  }

  /**
   * Gets all jobs from the queue with a custom prefix filter.
   * Used for subscriptions with custom prefix filters (filters at DB level).
   *
   * @param prefixFilter - The prefix values to filter by (empty object = all jobs)
   * @returns An array of jobs
   */
  private getAllJobsWithFilter(
    prefixFilter: Readonly<Record<string, string | number>>
  ): Array<JobStorageFormat<Input, Output>> {
    const filterEntries = Object.entries(prefixFilter);
    let whereClause = "WHERE queue = ?";
    const params: Array<string | number> = [this.queueName];

    // Build dynamic WHERE clause for the filter
    for (const [key, value] of filterEntries) {
      whereClause += ` AND ${key} = ?`;
      params.push(value);
    }

    const AllJobsQuery = `SELECT * FROM ${this.tableName} ${whereClause}`;
    const stmt = this.db.prepare<
      JobStorageFormat<Input, Output> & {
        input: string;
        output: string | null;
        progress_details: string | null;
      },
      Array<string | number>
    >(AllJobsQuery);
    const result = stmt.all(...params);
    return (result || []).map((details) => {
      // Parse JSON fields
      if (details.input) details.input = JSON.parse(details.input);
      if (details.output) details.output = JSON.parse(details.output);
      if (details.progress_details) details.progress_details = JSON.parse(details.progress_details);
      return details;
    });
  }

  /**
   * Checks if a prefix filter is custom (different from instance's prefixes).
   */
  private isCustomPrefixFilter(prefixFilter?: Readonly<Record<string, string | number>>): boolean {
    // No filter specified - use instance prefixes (not custom)
    if (prefixFilter === undefined) {
      return false;
    }
    // Empty filter - receive all (custom)
    if (Object.keys(prefixFilter).length === 0) {
      return true;
    }
    // Check if filter matches instance prefixes exactly
    const instanceKeys = Object.keys(this.prefixValues);
    const filterKeys = Object.keys(prefixFilter);
    if (instanceKeys.length !== filterKeys.length) {
      return true; // Different number of keys = custom
    }
    for (const key of instanceKeys) {
      if (this.prefixValues[key] !== prefixFilter[key]) {
        return true; // Different value = custom
      }
    }
    return false; // Matches instance prefixes exactly
  }

  /**
   * Gets or creates the shared polling subscription manager for normal subscriptions.
   * This ensures all normal subscriptions share a single polling loop per interval.
   */
  private getPollingManager(): PollingSubscriptionManager<
    JobStorageFormat<Input, Output>,
    unknown,
    QueueChangePayload<Input, Output>
  > {
    if (!this.pollingManager) {
      this.pollingManager = new PollingSubscriptionManager<
        JobStorageFormat<Input, Output>,
        unknown,
        QueueChangePayload<Input, Output>
      >(
        async () => {
          // Fetch jobs with instance's prefix filter (efficient DB-level filtering)
          const jobs = this.getAllJobs();
          return new Map(jobs.map((j) => [j.id, j]));
        },
        (a, b) => JSON.stringify(a) === JSON.stringify(b),
        {
          insert: (item) => ({ type: "INSERT" as const, new: item }),
          update: (oldItem, newItem) => ({ type: "UPDATE" as const, old: oldItem, new: newItem }),
          delete: (item) => ({ type: "DELETE" as const, old: item }),
        }
      );
    }
    return this.pollingManager;
  }

  /**
   * Creates a dedicated polling subscription for custom prefix filters.
   * This runs separately from the normal polling manager with DB-level filtering.
   */
  private subscribeWithCustomPrefixFilter(
    callback: (change: QueueChangePayload<Input, Output>) => void,
    prefixFilter: Readonly<Record<string, string | number>>,
    intervalMs: number
  ): () => void {
    let lastKnownJobs = new Map<unknown, JobStorageFormat<Input, Output>>();

    const poll = () => {
      try {
        const currentJobs = this.getAllJobsWithFilter(prefixFilter);
        const currentMap = new Map(currentJobs.map((j) => [j.id, j]));

        // Detect changes
        for (const [id, job] of currentMap) {
          const old = lastKnownJobs.get(id);
          if (!old) {
            callback({ type: "INSERT", new: job });
          } else if (JSON.stringify(old) !== JSON.stringify(job)) {
            callback({ type: "UPDATE", old, new: job });
          }
        }

        for (const [id, job] of lastKnownJobs) {
          if (!currentMap.has(id)) {
            callback({ type: "DELETE", old: job });
          }
        }

        lastKnownJobs = currentMap;
      } catch {
        // Ignore polling errors
      }
    };

    const intervalId = setInterval(poll, intervalMs);
    poll(); // Initial poll

    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Subscribes to changes in the queue.
   * Uses polling since SQLite has no native change notification support.
   *
   * Normal subscriptions (no custom prefix filter) share a single polling loop for efficiency.
   * Custom prefix filter subscriptions get their own dedicated polling loop with DB-level filtering.
   *
   * @param callback - Function called when a change occurs
   * @param options - Subscription options including polling interval and prefix filter
   * @returns Unsubscribe function
   */
  public subscribeToChanges(
    callback: (change: QueueChangePayload<Input, Output>) => void,
    options?: QueueSubscribeOptions
  ): () => void {
    const intervalMs = options?.pollingIntervalMs ?? 1000;

    // Check if this is a custom prefix filter subscription
    if (this.isCustomPrefixFilter(options?.prefixFilter)) {
      // Custom prefix filter - use dedicated polling with DB-level filtering
      return this.subscribeWithCustomPrefixFilter(callback, options!.prefixFilter!, intervalMs);
    }

    // Normal subscription - use shared polling manager (efficient)
    const manager = this.getPollingManager();
    return manager.subscribe(callback, { intervalMs });
  }
}
