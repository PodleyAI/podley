/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken } from "@podley/util";
import { ILimiter, RateLimiterWithBackoffOptions } from "./ILimiter";

export const MEMORY_JOB_RATE_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter.rate.memory");

/**
 * In-memory implementation of a rate limiter.
 * Manages request counts and delays to control job execution.
 */
export class InMemoryRateLimiter implements ILimiter {
  private requests: Date[] = [];
  private nextAvailableTime = new Date();
  private currentBackoffDelay: number;

  private readonly maxExecutions: number;
  private readonly windowSizeInMilliseconds: number;
  private readonly initialBackoffDelay: number;
  private readonly backoffMultiplier: number;
  private readonly maxBackoffDelay: number;

  constructor({
    maxExecutions,
    windowSizeInSeconds,
    initialBackoffDelay = 1_000,
    backoffMultiplier = 2,
    maxBackoffDelay = 600_000, // 10 minutes
  }: RateLimiterWithBackoffOptions) {
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

    this.maxExecutions = maxExecutions;
    this.windowSizeInMilliseconds = windowSizeInSeconds * 1_000;
    this.initialBackoffDelay = initialBackoffDelay;
    this.backoffMultiplier = backoffMultiplier;
    this.maxBackoffDelay = maxBackoffDelay;
    this.currentBackoffDelay = initialBackoffDelay;
  }

  private removeOldRequests() {
    const now = Date.now();
    const cutoff = now - this.windowSizeInMilliseconds;
    this.requests = this.requests.filter((d) => d.getTime() > cutoff);

    // if our scheduled time is in the past, reset it to now
    if (this.nextAvailableTime.getTime() < now) {
      this.nextAvailableTime = new Date(now);
    }
  }

  private increaseBackoff() {
    this.currentBackoffDelay = Math.min(
      this.currentBackoffDelay * this.backoffMultiplier,
      this.maxBackoffDelay
    );
  }

  private addJitter(base: number): number {
    // full jitter in [base, 2*base)
    return base + Math.random() * base;
  }

  async canProceed(): Promise<boolean> {
    this.removeOldRequests();

    const now = Date.now();
    const okRequestCount = this.requests.length < this.maxExecutions;
    const okTime = now >= this.nextAvailableTime.getTime();
    const canProceedNow = okRequestCount && okTime;

    if (!canProceedNow) {
      this.increaseBackoff();
    } else {
      this.currentBackoffDelay = this.initialBackoffDelay;
    }

    return canProceedNow;
  }

  async recordJobStart(): Promise<void> {
    this.requests.push(new Date());

    if (this.requests.length >= this.maxExecutions) {
      const earliest = this.requests[0].getTime();
      const windowExpires = earliest + this.windowSizeInMilliseconds;
      const backoffExpires = Date.now() + this.addJitter(this.currentBackoffDelay);
      this.nextAvailableTime = new Date(Math.max(windowExpires, backoffExpires));
    }
  }

  async recordJobCompletion(): Promise<void> {
    // no-op
  }

  async getNextAvailableTime(): Promise<Date> {
    this.removeOldRequests();
    return new Date(Math.max(Date.now(), this.nextAvailableTime.getTime()));
  }

  async setNextAvailableTime(date: Date): Promise<void> {
    if (date.getTime() > this.nextAvailableTime.getTime()) {
      this.nextAvailableTime = date;
    }
  }

  async clear(): Promise<void> {
    this.requests = [];
    this.nextAvailableTime = new Date();
    this.currentBackoffDelay = this.initialBackoffDelay;
  }
}
