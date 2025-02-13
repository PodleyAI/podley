//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Pool } from "pg";
import { ILimiter } from "../job/ILimiter";

/**
 * PostgreSQL implementation of a rate limiter.
 * Manages request counts and delays to control job execution.
 */
export class PostgresRateLimiter implements ILimiter {
  private readonly windowSizeInMilliseconds: number;

  constructor(
    protected readonly db: Pool,
    private readonly queueName: string,
    private readonly maxExecutions: number,
    windowSizeInMinutes: number
  ) {
    this.windowSizeInMilliseconds = windowSizeInMinutes * 60 * 1000;
    this.dbPromise = this.ensureTableExists();
  }

  private dbPromise: Promise<void>;

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
      return false;
    }

    // Retrieve the largest next_available_at and count of attempts in the window
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

    return attemptCount < this.maxExecutions;
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
      rateLimitedTime.setMinutes(
        rateLimitedTime.getMinutes() + this.windowSizeInMilliseconds / 60000
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
