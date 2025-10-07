//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { makeFingerprint, uuid4 } from "@podley/util";
import { createServiceToken } from "@podley/util";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IQueueStorage, JobStatus, JobStorageFormat } from "./IQueueStorage";

export const SUPABASE_QUEUE_STORAGE = createServiceToken<IQueueStorage<any, any>>(
  "jobqueue.storage.supabase"
);

/**
 * Supabase implementation of a job queue.
 * Provides storage and retrieval for job execution states using Supabase.
 */
export class SupabaseQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  constructor(
    protected readonly client: SupabaseClient,
    protected readonly queueName: string
  ) {}

  protected isSetup = true;

  public async setupDatabase(): Promise<SupabaseClient> {
    if (this.isSetup) return this.client;

    // Note: For Supabase, table creation should typically be done through migrations
    // This setup assumes the table already exists or uses exec_sql RPC function
    const createTypeSql = `CREATE TYPE IF NOT EXISTS job_status AS ENUM (${Object.values(JobStatus)
      .map((v) => `'${v}'`)
      .join(",")})`;

    const { error: typeError } = await this.client.rpc("exec_sql", { query: createTypeSql });
    // Ignore error if type already exists

    const createTableSql = `
    CREATE TABLE IF NOT EXISTS job_queue (
      id SERIAL NOT NULL,
      fingerprint text NOT NULL,
      queue text NOT NULL,
      job_run_id text NOT NULL,
      status text NOT NULL default 'PENDING' CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED','SKIPPED','ABORTING')),
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

    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS job_fetcher_idx ON job_queue (id, status, run_after)`,
      `CREATE INDEX IF NOT EXISTS job_queue_fetcher_idx ON job_queue (queue, status, run_after)`,
      `CREATE INDEX IF NOT EXISTS jobs_fingerprint_unique_idx ON job_queue (queue, fingerprint, status)`,
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await this.client.rpc("exec_sql", { query: indexSql });
      // Ignore index creation errors
    }

    this.isSetup = true;
    return this.client;
  }

  /**
   * Adds a new job to the queue.
   * @param job - The job to add
   * @returns The ID of the added job
   */
  public async add(job: JobStorageFormat<Input, Output>): Promise<unknown> {
    await this.setupDatabase();
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

    const { data, error } = await this.client
      .from("job_queue")
      .insert({
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
  public async get(id: number): Promise<JobStorageFormat<Input, Output> | undefined> {
    await this.setupDatabase();
    const { data, error } = await this.client
      .from("job_queue")
      .select("*")
      .eq("id", id)
      .eq("queue", this.queueName)
      .single();

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
    await this.setupDatabase();
    num = Number(num) || 100;

    const { data, error } = await this.client
      .from("job_queue")
      .select("*")
      .eq("queue", this.queueName)
      .eq("status", status)
      .order("run_after", { ascending: true })
      .limit(num);

    if (error) throw error;
    return (data as JobStorageFormat<Input, Output>[]) ?? [];
  }

  /**
   * Retrieves the next available job that is ready to be processed.
   * @returns The next job or undefined if no job is available
   */
  public async next(): Promise<JobStorageFormat<Input, Output> | undefined> {
    await this.setupDatabase();

    // First, find the next job
    const { data: jobs, error: selectError } = await this.client
      .from("job_queue")
      .select("*")
      .eq("queue", this.queueName)
      .eq("status", JobStatus.PENDING)
      .lte("run_after", new Date().toISOString())
      .order("run_after", { ascending: true })
      .limit(1);

    if (selectError) throw selectError;
    if (!jobs || jobs.length === 0) return undefined;

    const job = jobs[0];

    // Update its status
    const { data: updatedJob, error: updateError } = await this.client
      .from("job_queue")
      .update({
        status: JobStatus.PROCESSING,
        last_ran_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("queue", this.queueName)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedJob as JobStorageFormat<Input, Output>;
  }

  /**
   * Retrieves the number of jobs in the queue with a specific status.
   * @param status - The status of the jobs to count
   * @returns The count of jobs with the specified status
   */
  public async size(status = JobStatus.PENDING): Promise<number> {
    await this.setupDatabase();
    const { count, error } = await this.client
      .from("job_queue")
      .select("*", { count: "exact", head: true })
      .eq("queue", this.queueName)
      .eq("status", status);

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
    await this.setupDatabase();

    const now = new Date().toISOString();

    // Handle skipped without changing attempts
    if (jobDetails.status === JobStatus.SKIPPED) {
      const { error } = await this.client
        .from("job_queue")
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
      if (error) throw error;
      return;
    }

    // Read current attempts to compute next value deterministically
    const { data: current, error: getError } = await this.client
      .from("job_queue")
      .select("run_attempts")
      .eq("id", jobDetails.id as number)
      .eq("queue", this.queueName)
      .single();
    if (getError) throw getError;
    const nextAttempts = ((current?.run_attempts as number | undefined) ?? 0) + 1;

    if (jobDetails.status === JobStatus.PENDING) {
      const { error } = await this.client
        .from("job_queue")
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
      if (error) throw error;
      return;
    }

    if (jobDetails.status === JobStatus.COMPLETED || jobDetails.status === JobStatus.FAILED) {
      const { error } = await this.client
        .from("job_queue")
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
      if (error) throw error;
      return;
    }

    // Transitional states: PROCESSING/ABORTING etc - increment attempts like other stores
    const { error } = await this.client
      .from("job_queue")
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
    if (error) throw error;
  }

  /**
   * Clears all jobs from the queue.
   */
  public async deleteAll(): Promise<void> {
    await this.setupDatabase();
    const { error } = await this.client.from("job_queue").delete().eq("queue", this.queueName);

    if (error) throw error;
  }

  /**
   * Looks up cached output for a given input
   * Uses input fingerprinting for efficient matching
   * @returns The cached output or null if not found
   */
  public async outputForInput(input: Input): Promise<Output | null> {
    await this.setupDatabase();
    const fingerprint = await makeFingerprint(input);

    const { data, error } = await this.client
      .from("job_queue")
      .select("output")
      .eq("fingerprint", fingerprint)
      .eq("queue", this.queueName)
      .eq("status", JobStatus.COMPLETED)
      .single();

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
    await this.setupDatabase();
    const { error } = await this.client
      .from("job_queue")
      .update({ status: JobStatus.ABORTING })
      .eq("id", jobId)
      .eq("queue", this.queueName);

    if (error) throw error;
  }

  /**
   * Retrieves all jobs for a given job run ID.
   * @param job_run_id - The ID of the job run to retrieve
   * @returns An array of jobs
   */
  public async getByRunId(job_run_id: string): Promise<Array<JobStorageFormat<Input, Output>>> {
    await this.setupDatabase();
    const { data, error } = await this.client
      .from("job_queue")
      .select("*")
      .eq("job_run_id", job_run_id)
      .eq("queue", this.queueName);

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
    await this.setupDatabase();
    const { error } = await this.client
      .from("job_queue")
      .update({
        progress,
        progress_message: message,
        progress_details: details,
      })
      .eq("id", jobId)
      .eq("queue", this.queueName);

    if (error) throw error;
  }

  /**
   * Deletes a job by its ID
   */
  public async delete(jobId: unknown): Promise<void> {
    await this.setupDatabase();
    const { error } = await this.client
      .from("job_queue")
      .delete()
      .eq("id", jobId)
      .eq("queue", this.queueName);

    if (error) throw error;
  }

  /**
   * Delete jobs with a specific status older than a cutoff date
   * @param status - Status of jobs to delete
   * @param olderThanMs - Delete jobs completed more than this many milliseconds ago
   */
  public async deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void> {
    await this.setupDatabase();
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();

    const { error } = await this.client
      .from("job_queue")
      .delete()
      .eq("queue", this.queueName)
      .eq("status", status)
      .not("completed_at", "is", null)
      .lte("completed_at", cutoffDate);

    if (error) throw error;
  }
}
