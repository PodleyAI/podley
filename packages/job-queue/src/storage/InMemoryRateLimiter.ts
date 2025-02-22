//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ILimiter } from "../job/ILimiter";

/**
 * In-memory implementation of a rate limiter.
 * Manages request counts and delays to control job execution.
 */
export class InMemoryRateLimiter implements ILimiter {
  private requests: Date[] = [];
  private nextAvailableTime: Date = new Date();
  private readonly maxRequests: number;
  private readonly windowSizeInMilliseconds: number;

  constructor(maxRequests: number, windowSizeInSeconds: number) {
    this.maxRequests = maxRequests;
    this.windowSizeInMilliseconds = windowSizeInSeconds * 1000;
  }

  private removeOldRequests() {
    const now = new Date();
    const threshold = new Date(now.getTime() - this.windowSizeInMilliseconds);
    this.requests = this.requests.filter((date) => date > threshold);
    // Also consider nextAvailableTime in the cleaning process
    if (this.nextAvailableTime < now) {
      this.nextAvailableTime = now; // Reset if past the delay
    }
  }

  async canProceed(): Promise<boolean> {
    this.removeOldRequests();
    return (
      this.requests.length < this.maxRequests && Date.now() >= this.nextAvailableTime.getTime()
    );
  }

  async recordJobStart(): Promise<void> {
    this.requests.push(new Date());
    if (this.requests.length >= this.maxRequests) {
      const earliestRequest = this.requests[0];
      this.nextAvailableTime = new Date(earliestRequest.getTime() + this.windowSizeInMilliseconds);
    }
  }

  async recordJobCompletion(): Promise<void> {
    // No action needed for rate limiting on job completion
  }

  async getNextAvailableTime(): Promise<Date> {
    this.removeOldRequests();
    // Consider both the rate limit and externally set next available time
    if (this.requests.length >= this.maxRequests) {
      const oldestRequestTime = this.requests[0];
      return new Date(
        Math.max(
          oldestRequestTime.getTime() + this.windowSizeInMilliseconds,
          this.nextAvailableTime.getTime()
        )
      );
    }
    return new Date(Math.max(Date.now(), this.nextAvailableTime.getTime()));
  }

  async setNextAvailableTime(date: Date): Promise<void> {
    // Set the next available time if it's in the future
    if (date > this.nextAvailableTime) {
      this.nextAvailableTime = date;
    }
  }

  async clear(): Promise<void> {
    this.requests = [];
    this.nextAvailableTime = new Date();
  }
}
