//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ILimiter } from "./ILimiter";
import { createServiceToken } from "@podley/util";

export const CONCURRENT_JOB_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter.concurrent");

/**
 * Concurrency limiter that limits the number of concurrent jobs.
 */
export class ConcurrencyLimiter implements ILimiter {
  private currentRunningJobs: number = 0;
  private readonly maxConcurrentJobs: number;
  private readonly timeSliceInMilliseconds: number;
  private nextAllowedStartTime: Date = new Date();

  constructor(maxConcurrentJobs: number, timeSliceInMilliseconds: number = 1000) {
    this.maxConcurrentJobs = maxConcurrentJobs;
    this.timeSliceInMilliseconds = timeSliceInMilliseconds;
  }

  async canProceed(): Promise<boolean> {
    return (
      this.currentRunningJobs < this.maxConcurrentJobs &&
      Date.now() >= this.nextAllowedStartTime.getTime()
    );
  }

  async recordJobStart(): Promise<void> {
    if (this.currentRunningJobs < this.maxConcurrentJobs) {
      this.currentRunningJobs++;
      this.nextAllowedStartTime = new Date(Date.now() + this.timeSliceInMilliseconds);
    }
  }

  async recordJobCompletion(): Promise<void> {
    this.currentRunningJobs = Math.max(0, this.currentRunningJobs - 1);
  }

  async getNextAvailableTime(): Promise<Date> {
    return this.currentRunningJobs < this.maxConcurrentJobs
      ? new Date()
      : new Date(Date.now() + this.timeSliceInMilliseconds);
  }

  async setNextAvailableTime(date: Date): Promise<void> {
    if (date > this.nextAllowedStartTime) {
      this.nextAllowedStartTime = date;
    }
  }

  async clear(): Promise<void> {
    this.currentRunningJobs = 0;
    this.nextAllowedStartTime = new Date();
  }
}
