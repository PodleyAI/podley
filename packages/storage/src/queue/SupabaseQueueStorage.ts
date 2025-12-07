/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceToken, makeFingerprint, uuid4 } from "@workglow/util";
import {
  IQueueStorage,
  JobStatus,
  JobStorageFormat,
  PrefixColumn,
  QueueStorageOptions,
} from "./IQueueStorage";

export const SUPABASE_QUEUE_STORAGE = createServiceToken<IQueueStorage<any, any>>(
  "jobqueue.storage.supabase"
);

/**
 * Supabase implementation of a job queue.
 * Provides storage and retrieval for job execution states using Supabase.
 */
export class SupabaseQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  /** The prefix column definitions */
  protected readonly prefixes: readonly PrefixColumn[];
  /** The prefix values for filtering */
  protected readonly prefixValues: Readonly<Record<string, string | number>>;
  /** The table name for the job queue */
  protected readonly tableName: string;

  constructor(
    protected readonly client: SupabaseClient,
    protected readonly queueName: string,
    options?: QueueStorageOptions
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
   * Gets the SQL column type for a prefix column (Supabase supports UUID natively)
   */
  private getPrefixColumnType(type: PrefixColumn["type"]): string {
    return type === "uuid" ? "UUID" : "INTEGER";
  }

  /**
   * Builds the prefix columns SQL for CREATE TABLE
   */
  private buildPrefixColumnsSql(): string {
    if (this.prefixes.length === 0) return "";
    return (
      this.prefixes
        .map((p) => `${p.name} ${this.getPrefixColumnType(p.type)} NOT NULL`)
        .join(",\n      ") + ",\n      "
    );
  }

  /**
   * Builds prefix column names for use in queries
   */
  private getPrefixColumnNames(): string[] {
    return this.prefixes.map((p) => p.name);
  }

  /**
   * Applies prefix filters to a Supabase query builder
   */
  private applyPrefixFilters<T>(query: T): T {
    let result = query as any;
    for (const prefix of this.prefixes) {
      result = result.eq(prefix.name, this.prefixValues[prefix.name]);
    }
    return result as T;
  }

  /**
   * Gets prefix values as an object for inserts
   */
  private getPrefixInsertValues(): Record<string, string | number> {
    const values: Record<string, string | number> = {};
    for (const prefix of this.prefixes) {
      values[prefix.name] = this.prefixValues[prefix.name];
    }
    return values;
  }

  public async setupDatabase(): Promise<void> {
    // Note: For Supabase, table creation should typically be done through migrations
    // This setup assumes the table already exists or uses exec_sql RPC function
    const createTypeSql = `CREATE TYPE job_status AS ENUM (${Object.values(JobStatus)
      .map((v) => `'${v}'`)
      .join(",")})`;

    const { error: typeError } = await this.client.rpc("exec_sql", { query: createTypeSql });
    // Ignore error if type already exists (code 42710)
    if (typeError && typeError.code !== "42710") {
      throw typeError;
    }

    const prefixColumnsSql = this.buildPrefixColumnsSql();
    const prefixColumnNames = this.getPrefixColumnNames();
    const prefixIndexPrefix =
      prefixColumnNames.length > 0 ? prefixColumnNames.join(", ") + ", " : "";
    const indexSuffix = prefixColumnNames.length > 0 ? "_" + prefixColumnNames.join("_") : "";

    const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${this.tableName} (
      id SERIAL NOT NULL,
      ${prefixColumnsSql}fingerprint text NOT NULL,
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

    const { error: tableError } = await this.client.rpc("exec_sql", { query: createTableSql });
    if (tableError) {
      // Ignore error if table already exists (code 42P07)
      if (tableError.code !== "42P07") {
        throw tableError;
      }
    }

    // Create indexes with prefix columns prepended
    const indexes = [
      `CREATE INDEX IF NOT EXISTS job_fetcher${indexSuffix}_idx ON ${this.tableName} (${prefixIndexPrefix}id, status, run_after)`,
      `CREATE INDEX IF NOT EXISTS job_queue_fetcher${indexSuffix}_idx ON ${this.tableName} (${prefixIndexPrefix}queue, status, run_after)`,
      `CREATE INDEX IF NOT EXISTS jobs_fingerprint${indexSuffix}_unique_idx ON ${this.tableName} (${prefixIndexPrefix}queue, fingerprint, status)`,
    ];

    for (const indexSql of indexes) {
      await this.client.rpc("exec_sql", { query: indexSql });
      // Ignore index creation errors
    }
  }

  /**
   * Adds a new job to the queue.
   * @param job - The job to add
   * @returns The ID of the added job
   */
  public async add(job: JobStorageFormat<Input, Output>): Promise<unknown> {
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

    const prefixInsertValues = this.getPrefixInsertValues();

    const { data, error } = await this.client
      .from(this.tableName)
      .insert({
        ...prefixInsertValues,
        queue: job.queue,
        fingerprint: job.fingerprint,
        input: job.input,
        run_after: job.run_after,
        created_at: job.created_at,
        deadline_at: job.deadline_at,
        max_retries: job.max_retries,
        job_run_id: job.job_run_id,
        progress: job.progress,
        progress_message: job.progress_message,
        progress_details: job.progress_details,
      })
      .select("id")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to add to queue");

    job.id = data.id;
    return job.id;
  }

  /**
   * Retrieves a job by its ID.
   * @param id - The ID of the job to retrieve
   * @returns The job if found, undefined otherwise
   */
  public async get(id: unknown): Promise<JobStorageFormat<Input, Output> | undefined> {
    let query = this.client
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .eq("queue", this.queueName);

    query = this.applyPrefixFilters(query);

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") return undefined; // Not found
      throw error;
    }

    return data as JobStorageFormat<Input, Output> | undefined;
  }

  /**
   * Retrieves a slice of jobs from the queue.
   * @param status - The status to filter by
   * @param num - Maximum number of jobs to return
   * @returns An array of jobs
   */
  public async peek(
    status: JobStatus = JobStatus.PENDING,
    num: number = 100
  ): Promise<JobStorageFormat<Input, Output>[]> {
    num = Number(num) || 100;

    let query = this.client
      .from(this.tableName)
      .select("*")
      .eq("queue", this.queueName)
      .eq("status", status);

    query = this.applyPrefixFilters(query);

    const { data, error } = await query.order("run_after", { ascending: true }).limit(num);

    if (error) throw error;
    return (data as JobStorageFormat<Input, Output>[]) ?? [];
  }

  /**
   * Retrieves the next available job that is ready to be processed.
   * @returns The next job or undefined if no job is available
   */
  public async next(): Promise<JobStorageFormat<Input, Output> | undefined> {
    // First, find the next job
    let selectQuery = this.client
      .from(this.tableName)
      .select("*")
      .eq("queue", this.queueName)
      .eq("status", JobStatus.PENDING)
      .lte("run_after", new Date().toISOString());

    selectQuery = this.applyPrefixFilters(selectQuery);

    const { data: jobs, error: selectError } = await selectQuery
      .order("run_after", { ascending: true })
      .limit(1);

    if (selectError) throw selectError;
    if (!jobs || jobs.length === 0) return undefined;

    const job = jobs[0];

    // Update its status
    let updateQuery = this.client
      .from(this.tableName)
      .update({
        status: JobStatus.PROCESSING,
        last_ran_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("queue", this.queueName);

    updateQuery = this.applyPrefixFilters(updateQuery);

    const { data: updatedJob, error: updateError } = await updateQuery.select().single();

    if (updateError) throw updateError;
    return updatedJob as JobStorageFormat<Input, Output>;
  }

  /**
   * Retrieves the number of jobs in the queue with a specific status.
   * @param status - The status of the jobs to count
   * @returns The count of jobs with the specified status
   */
  public async size(status = JobStatus.PENDING): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("queue", this.queueName)
      .eq("status", status);

    query = this.applyPrefixFilters(query);

    const { count, error } = await query;

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Marks a job as complete with its output or error.
   * Enhanced error handling:
   * - For a retryable error, increments run_attempts and updates run_after.
   * - Marks a job as FAILED immediately for permanent or generic errors.
   */
  public async complete(jobDetails: JobStorageFormat<Input, Output>): Promise<void> {
    const now = new Date().toISOString();

    // Handle disabled without changing attempts
    if (jobDetails.status === JobStatus.DISABLED) {
      let query = this.client
        .from(this.tableName)
        .update({
          status: jobDetails.status,
          progress: 100,
          progress_message: "",
          progress_details: null,
          completed_at: now,
          last_ran_at: now,
        })
        .eq("id", jobDetails.id)
        .eq("queue", this.queueName);
      query = this.applyPrefixFilters(query);
      const { error } = await query;
      if (error) throw error;
      return;
    }

    // Read current attempts to compute next value deterministically
    let getQuery = this.client
      .from(this.tableName)
      .select("run_attempts")
      .eq("id", jobDetails.id as number)
      .eq("queue", this.queueName);
    getQuery = this.applyPrefixFilters(getQuery);
    const { data: current, error: getError } = await getQuery.single();
    if (getError) throw getError;
    const nextAttempts = ((current?.run_attempts as number | undefined) ?? 0) + 1;

    if (jobDetails.status === JobStatus.PENDING) {
      let query = this.client
        .from(this.tableName)
        .update({
          error: jobDetails.error ?? null,
          error_code: jobDetails.error_code ?? null,
          status: jobDetails.status,
          run_after: jobDetails.run_after!,
          progress: 0,
          progress_message: "",
          progress_details: null,
          run_attempts: nextAttempts,
          last_ran_at: now,
        })
        .eq("id", jobDetails.id)
        .eq("queue", this.queueName);
      query = this.applyPrefixFilters(query);
      const { error } = await query;
      if (error) throw error;
      return;
    }

    if (jobDetails.status === JobStatus.COMPLETED || jobDetails.status === JobStatus.FAILED) {
      let query = this.client
        .from(this.tableName)
        .update({
          output: jobDetails.output ?? null,
          error: jobDetails.error ?? null,
          error_code: jobDetails.error_code ?? null,
          status: jobDetails.status,
          progress: 100,
          progress_message: "",
          progress_details: null,
          run_attempts: nextAttempts,
          completed_at: now,
          last_ran_at: now,
        })
        .eq("id", jobDetails.id)
        .eq("queue", this.queueName);
      query = this.applyPrefixFilters(query);
      const { error } = await query;
      if (error) throw error;
      return;
    }

    // Transitional states: PROCESSING/ABORTING etc - increment attempts like other stores
    let query = this.client
      .from(this.tableName)
      .update({
        status: jobDetails.status,
        output: jobDetails.output ?? null,
        error: jobDetails.error ?? null,
        error_code: jobDetails.error_code ?? null,
        run_after: jobDetails.run_after ?? null,
        run_attempts: nextAttempts,
        last_ran_at: now,
      })
      .eq("id", jobDetails.id)
      .eq("queue", this.queueName);
    query = this.applyPrefixFilters(query);
    const { error } = await query;
    if (error) throw error;
  }

  /**
   * Clears all jobs from the queue.
   */
  public async deleteAll(): Promise<void> {
    let query = this.client.from(this.tableName).delete().eq("queue", this.queueName);
    query = this.applyPrefixFilters(query);
    const { error } = await query;

    if (error) throw error;
  }

  /**
   * Looks up cached output for a given input
   * Uses input fingerprinting for efficient matching
   * @returns The cached output or null if not found
   */
  public async outputForInput(input: Input): Promise<Output | null> {
    const fingerprint = await makeFingerprint(input);

    let query = this.client
      .from(this.tableName)
      .select("output")
      .eq("fingerprint", fingerprint)
      .eq("queue", this.queueName)
      .eq("status", JobStatus.COMPLETED);

    query = this.applyPrefixFilters(query);

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    return data?.output ?? null;
  }

  /**
   * Aborts a job by setting its status to "ABORTING".
   * This method will signal the corresponding AbortController so that
   * the job's execute() method (if it supports an AbortSignal parameter)
   * can clean up and exit.
   */
  public async abort(jobId: unknown): Promise<void> {
    let query = this.client
      .from(this.tableName)
      .update({ status: JobStatus.ABORTING })
      .eq("id", jobId)
      .eq("queue", this.queueName);

    query = this.applyPrefixFilters(query);
    const { error } = await query;

    if (error) throw error;
  }

  /**
   * Retrieves all jobs for a given job run ID.
   * @param job_run_id - The ID of the job run to retrieve
   * @returns An array of jobs
   */
  public async getByRunId(job_run_id: string): Promise<Array<JobStorageFormat<Input, Output>>> {
    let query = this.client
      .from(this.tableName)
      .select("*")
      .eq("job_run_id", job_run_id)
      .eq("queue", this.queueName);

    query = this.applyPrefixFilters(query);
    const { data, error } = await query;

    if (error) throw error;
    return (data as Array<JobStorageFormat<Input, Output>>) ?? [];
  }

  /**
   * Implements the saveProgress method
   */
  public async saveProgress(
    jobId: unknown,
    progress: number,
    message: string,
    details: Record<string, any>
  ): Promise<void> {
    let query = this.client
      .from(this.tableName)
      .update({
        progress,
        progress_message: message,
        progress_details: details,
      })
      .eq("id", jobId)
      .eq("queue", this.queueName);

    query = this.applyPrefixFilters(query);
    const { error } = await query;

    if (error) throw error;
  }

  /**
   * Deletes a job by its ID
   */
  public async delete(jobId: unknown): Promise<void> {
    let query = this.client
      .from(this.tableName)
      .delete()
      .eq("id", jobId)
      .eq("queue", this.queueName);

    query = this.applyPrefixFilters(query);
    const { error } = await query;

    if (error) throw error;
  }

  /**
   * Delete jobs with a specific status older than a cutoff date
   * @param status - Status of jobs to delete
   * @param olderThanMs - Delete jobs completed more than this many milliseconds ago
   */
  public async deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();

    let query = this.client
      .from(this.tableName)
      .delete()
      .eq("queue", this.queueName)
      .eq("status", status)
      .not("completed_at", "is", null)
      .lte("completed_at", cutoffDate);

    query = this.applyPrefixFilters(query);
    const { error } = await query;

    if (error) throw error;
  }
}
