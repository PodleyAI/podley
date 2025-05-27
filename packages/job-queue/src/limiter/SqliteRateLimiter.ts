//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ILimiter, RateLimiterWithBackoffOptions } from "@podley/job-queue";
import type { Sqlite } from "@podley/sqlite";
import { createServiceToken, toSQLiteTimestamp } from "@podley/util";

export const SQLITE_JOB_RATE_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter.rate.sqlite");

/**
 * SQLite implementation of a rate limiter.
 * Manages request counts and delays to control job execution.
 */
export class SqliteRateLimiter implements ILimiter {
  private readonly db: Sqlite.Database;
  private readonly queueName: string;
  private readonly windowSizeInMilliseconds: number;
  private currentBackoffDelay: number;

  constructor(
    db: Sqlite.Database,
    queueName: string,
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

    this.db = db;
    this.queueName = queueName;
    this.windowSizeInMilliseconds = windowSizeInSeconds * 1000;
    this.maxExecutions = maxExecutions;
    this.initialBackoffDelay = initialBackoffDelay;
    this.backoffMultiplier = backoffMultiplier;
    this.maxBackoffDelay = maxBackoffDelay;
    this.currentBackoffDelay = initialBackoffDelay;
    this.ensureTableExists();
  }

  private readonly maxExecutions: number;
  private readonly initialBackoffDelay: number;
  private readonly backoffMultiplier: number;
  private readonly maxBackoffDelay: number;

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

  public ensureTableExists() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_queue_execution_tracking (
        id INTEGER PRIMARY KEY,
        queue_name TEXT NOT NULL,
        executed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_queue_next_available (
        queue_name TEXT PRIMARY KEY,
        next_available_at TEXT
      )
    `);
    return this;
  }

  /**
   * Clears all rate limit entries for this queue.
   */
  async clear() {
    this.db
      .prepare("DELETE FROM job_queue_execution_tracking WHERE queue_name = ?")
      .run(this.queueName);
    this.db
      .prepare("DELETE FROM job_queue_next_available WHERE queue_name = ?")
      .run(this.queueName);
  }

  /**
   * Checks if a job can proceed based on rate limiting rules.
   * @returns True if the job can proceed, false otherwise
   */
  async canProceed(): Promise<boolean> {
    const nextAvailableTimeStmt = this.db.prepare(`
      SELECT next_available_at
      FROM job_queue_next_available
      WHERE queue_name = ?`);
    const nextAvailableResult = nextAvailableTimeStmt.get(this.queueName) as
      | { next_available_at: string }
      | undefined;

    if (
      nextAvailableResult &&
      new Date(nextAvailableResult.next_available_at + "Z").getTime() > Date.now()
    ) {
      this.increaseBackoff();
      return false;
    }

    const thresholdTime = toSQLiteTimestamp(new Date(Date.now() - this.windowSizeInMilliseconds));
    const result = this.db
      .prepare(
        `SELECT COUNT(*) AS attempt_count
          FROM job_queue_execution_tracking
          WHERE queue_name = ? AND executed_at > ?`
      )
      .get(this.queueName, thresholdTime!) as { attempt_count: number };

    const canProceedNow = result.attempt_count < this.maxExecutions;

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
    const stmt = this.db
      .prepare(
        `INSERT INTO job_queue_execution_tracking (queue_name)
          VALUES (?)`
      )
      .run(this.queueName);

    // Check if we need to set a backoff time
    const result = this.db
      .prepare(
        `SELECT COUNT(*) AS attempt_count
          FROM job_queue_execution_tracking
          WHERE queue_name = ?`
      )
      .get(this.queueName) as { attempt_count: number };

    if (result.attempt_count >= this.maxExecutions) {
      const backoffExpires = new Date(Date.now() + this.addJitter(this.currentBackoffDelay));
      await this.setNextAvailableTime(backoffExpires);
    }
  }

  async recordJobCompletion(): Promise<void> {
    // Implementation can be no-op as completion doesn't affect rate limiting
  }

  async getNextAvailableTime(): Promise<Date> {
    // Get the time when the rate limit will allow the next job execution
    // by finding the oldest execution within the rate limit window and adding the window size to it.
    const rateLimitedTimeStmt = this.db.prepare(`
      SELECT executed_at
      FROM job_queue_execution_tracking
      WHERE queue_name = ?
      ORDER BY executed_at ASC
      LIMIT 1 OFFSET ?`);
    const oldestExecution = rateLimitedTimeStmt.get(this.queueName, this.maxExecutions - 1) as
      | { executed_at: string }
      | undefined;

    let rateLimitedTime = new Date();
    if (oldestExecution) {
      rateLimitedTime = new Date(oldestExecution.executed_at + "Z");
      rateLimitedTime.setSeconds(
        rateLimitedTime.getSeconds() + this.windowSizeInMilliseconds / 1000
      );
    }

    // Get the next available time set externally, if any
    const nextAvailableStmt = this.db.prepare(`
      SELECT next_available_at
      FROM job_queue_next_available
      WHERE queue_name = ?`);
    const nextAvailableResult = nextAvailableStmt.get(this.queueName) as
      | { next_available_at: string }
      | undefined;

    let nextAvailableTime = new Date();
    if (nextAvailableResult?.next_available_at) {
      nextAvailableTime = new Date(nextAvailableResult.next_available_at + "Z");
    }

    // Return the later of the two times
    return nextAvailableTime > rateLimitedTime ? nextAvailableTime : rateLimitedTime;
  }

  async setNextAvailableTime(date: Date): Promise<void> {
    const nextAvailableAt = date.toISOString();
    this.db
      .prepare(
        `
        INSERT INTO job_queue_next_available (queue_name, next_available_at)
        VALUES (?, ?)
        ON CONFLICT(queue_name) DO UPDATE SET next_available_at = excluded.next_available_at`
      )
      .run(this.queueName, nextAvailableAt);
  }
}
