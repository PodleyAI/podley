//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ILimiter, RateLimiterWithBackoffOptions } from "@ellmers/job-queue";
import { createServiceToken } from "@ellmers/util";
import { Pool } from "pg";

export const POSTGRES_JOB_RATE_LIMITER = createServiceToken<ILimiter>(
  "jobqueue.limiter.rate.postgres"
);

/**
 * PostgreSQL implementation of a rate limiter.
 * Manages request counts and delays to control job execution.
 */
export class PostgresRateLimiter implements ILimiter {
  private readonly windowSizeInMilliseconds: number;
  private currentBackoffDelay: number;

  constructor(
    protected readonly db: Pool,
    private readonly queueName: string,
    {
      maxExecutions,
      windowSizeInSeconds,
      initialBackoffDelay = 1_000,
      backoffMultiplier = 2,
      maxBackoffDelay = 600_000, // 10 minutes
    }: RateLimiterWithBackoffOptions
  ) {
    if (maxExecutions <= 0) {
      throw new Error("maxExecutions must be greater than 0");
    }
    if (windowSizeInSeconds <= 0) {
      throw new Error("windowSizeInSeconds must be greater than 0");
    }
    if (initialBackoffDelay <= 0) {
      throw new Error("initialBackoffDelay must be greater than 0");
    }
    if (backoffMultiplier <= 1) {
      throw new Error("backoffMultiplier must be greater than 1");
    }
    if (maxBackoffDelay <= initialBackoffDelay) {
      throw new Error("maxBackoffDelay must be greater than initialBackoffDelay");
    }

    this.windowSizeInMilliseconds = windowSizeInSeconds * 1000;
    this.maxExecutions = maxExecutions;
    this.initialBackoffDelay = initialBackoffDelay;
    this.backoffMultiplier = backoffMultiplier;
    this.maxBackoffDelay = maxBackoffDelay;
    this.currentBackoffDelay = initialBackoffDelay;
    this.dbPromise = this.ensureTableExists();
  }

  private readonly maxExecutions: number;
  private readonly initialBackoffDelay: number;
  private readonly backoffMultiplier: number;
  private readonly maxBackoffDelay: number;
  private dbPromise: Promise<void>;

  private addJitter(base: number): number {
    // full jitter in [base, 2*base)
    return base + Math.random() * base;
  }

  private increaseBackoff() {
    this.currentBackoffDelay = Math.min(
      this.currentBackoffDelay * this.backoffMultiplier,
      this.maxBackoffDelay
    );
  }

  public async ensureTableExists() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS job_queue_execution_tracking (
        id SERIAL PRIMARY KEY,
        queue_name TEXT NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS job_queue_next_available (
        queue_name TEXT PRIMARY KEY,
        next_available_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
  }

  /**
   * Clears all rate limit entries for this queue.
   */
  async clear(): Promise<void> {
    await this.dbPromise;
    await this.db.query(`DELETE FROM job_queue_execution_tracking WHERE queue_name = $1`, [
      this.queueName,
    ]);
    await this.db.query(`DELETE FROM job_queue_next_available WHERE queue_name = $1`, [
      this.queueName,
    ]);
  }

  /**
   * Checks if a job can proceed based on rate limiting rules.
   * @returns True if the job can proceed, false otherwise
   */
  async canProceed(): Promise<boolean> {
    await this.dbPromise;
    const nextAvailableResult = await this.db.query(
      `
      SELECT next_available_at
      FROM job_queue_next_available
      WHERE queue_name = $1
    `,
      [this.queueName]
    );
    const nextAvailableTime = nextAvailableResult.rows[0]?.next_available_at;

    if (nextAvailableTime && new Date(nextAvailableTime).getTime() > Date.now()) {
      this.increaseBackoff();
      return false;
    }

    // Retrieve the count of attempts in the window
    const result = await this.db.query(
      `
      SELECT 
        COUNT(*) AS attempt_count
      FROM job_queue_execution_tracking
      WHERE 
        queue_name = $1
        AND executed_at > $2
    `,
      [this.queueName, new Date(Date.now() - this.windowSizeInMilliseconds).toISOString()]
    );

    const attemptCount = result.rows[0]?.attempt_count;
    const canProceedNow = attemptCount < this.maxExecutions;

    if (!canProceedNow) {
      this.increaseBackoff();
    } else {
      this.currentBackoffDelay = this.initialBackoffDelay;
    }

    return canProceedNow;
  }

  /**
   * Records a new job attempt.
   * @returns The ID of the added job
   */
  async recordJobStart(): Promise<void> {
    await this.dbPromise;
    await this.db.query(
      `
      INSERT INTO job_queue_execution_tracking (queue_name)
      VALUES ($1)
    `,
      [this.queueName]
    );

    // Check if we need to set a backoff time
    const result = await this.db.query(
      `
      SELECT COUNT(*) AS attempt_count
      FROM job_queue_execution_tracking
      WHERE queue_name = $1
    `,
      [this.queueName]
    );

    if (result.rows[0].attempt_count >= this.maxExecutions) {
      const backoffExpires = new Date(Date.now() + this.addJitter(this.currentBackoffDelay));
      await this.setNextAvailableTime(backoffExpires);
    }
  }

  async recordJobCompletion(): Promise<void> {
    // Implementation can be no-op as completion doesn't affect rate limiting
  }

  /**
   * Retrieves the next available time for the specific queue.
   * @returns The next available time
   */
  async getNextAvailableTime(): Promise<Date> {
    await this.dbPromise;
    // Query for the earliest job attempt within the window that reaches the limit
    const result = await this.db.query(
      `
      SELECT executed_at
      FROM job_queue_execution_tracking
      WHERE queue_name = $1
      ORDER BY executed_at ASC
      LIMIT 1 OFFSET $2
    `,
      [this.queueName, this.maxExecutions - 1]
    );

    const oldestExecution = result.rows[0];
    let rateLimitedTime = new Date();
    if (oldestExecution) {
      rateLimitedTime = new Date(oldestExecution.executed_at);
      rateLimitedTime.setSeconds(
        rateLimitedTime.getSeconds() + this.windowSizeInMilliseconds / 1000
      );
    }

    // Get the next available time set externally, if any
    const nextAvailableResult = await this.db.query(
      `
      SELECT next_available_at
      FROM job_queue_next_available
      WHERE queue_name = $1
    `,
      [this.queueName]
    );

    let nextAvailableTime = new Date();
    if (nextAvailableResult?.rows[0]?.next_available_at) {
      nextAvailableTime = new Date(nextAvailableResult.rows[0].next_available_at);
    }

    return nextAvailableTime > rateLimitedTime ? nextAvailableTime : rateLimitedTime;
  }

  /**
   * Sets the next available time for the specific queue.
   * @param date - The new next available time
   */
  async setNextAvailableTime(date: Date): Promise<void> {
    await this.dbPromise;
    // Update the next available time for the specific queue. If no entry exists, insert a new one.
    await this.db.query(
      `
      INSERT INTO job_queue_next_available (queue_name, next_available_at)
      VALUES ($1, $2)
      ON CONFLICT (queue_name)
      DO UPDATE SET next_available_at = EXCLUDED.next_available_at;
    `,
      [this.queueName, date.toISOString()]
    );
  }
}
