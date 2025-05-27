//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@podley/util";
import { ILimiter, RateLimiterOptions } from "./ILimiter";

export const EVENLY_SPACED_JOB_RATE_LIMITER = createServiceToken<ILimiter>(
  "jobqueue.limiter.rate.evenlyspaced"
);

/**
 * Rate limiter that spreads requests evenly across a time window.
 * Instead of allowing all requests up to the limit and then waiting,
 * this limiter spaces out the requests evenly across the window.
 */
export class EvenlySpacedRateLimiter implements ILimiter {
  private readonly maxExecutions: number;
  private readonly windowSizeMs: number;
  private readonly idealInterval: number;
  private nextAvailableTime: number = Date.now();
  private lastStartTime: number = 0;
  private durations: number[] = [];

  constructor({ maxExecutions, windowSizeInSeconds }: RateLimiterOptions) {
    if (maxExecutions <= 0) {
      throw new Error("maxExecutions must be > 0");
    }
    if (windowSizeInSeconds <= 0) {
      throw new Error("windowSizeInSeconds must be > 0");
    }
    this.maxExecutions = maxExecutions;
    this.windowSizeMs = windowSizeInSeconds * 1_000;
    // If you want exactly maxExecutions in windowSize, start one every this many ms:
    this.idealInterval = this.windowSizeMs / this.maxExecutions;
  }

  /** Can we start a new job right now? */
  async canProceed(): Promise<boolean> {
    const now = Date.now();
    return now >= this.nextAvailableTime;
  }

  /** Record that a job is starting now. */
  async recordJobStart(): Promise<void> {
    const now = Date.now();
    this.lastStartTime = now;

    // If no timing data yet, assume zero run-time (ideal interval)
    if (this.durations.length === 0) {
      this.nextAvailableTime = now + this.idealInterval;
    } else {
      // Compute average run duration
      const sum = this.durations.reduce((a, b) => a + b, 0);
      const avgDuration = sum / this.durations.length;
      // Schedule next start: ideal spacing minus average duration
      const waitMs = Math.max(0, this.idealInterval - avgDuration);
      this.nextAvailableTime = now + waitMs;
    }
  }

  /**
   * Call this when a job finishes.
   * We measure its duration, update our running-average,
   * and then compute how long to wait before the next job start.
   */
  async recordJobCompletion(): Promise<void> {
    const now = Date.now();
    const duration = now - this.lastStartTime;
    this.durations.push(duration);
    if (this.durations.length > this.maxExecutions) {
      this.durations.shift();
    }
  }

  async getNextAvailableTime(): Promise<Date> {
    return new Date(this.nextAvailableTime);
  }

  async setNextAvailableTime(date: Date): Promise<void> {
    const t = date.getTime();
    if (t > this.nextAvailableTime) {
      this.nextAvailableTime = t;
    }
  }

  async clear(): Promise<void> {
    this.durations = [];
    this.nextAvailableTime = Date.now();
    this.lastStartTime = 0;
  }
}
