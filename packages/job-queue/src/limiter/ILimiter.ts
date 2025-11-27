/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken } from "@workglow/util";

export const JOB_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter");

/**
 * Interface for a job limiter.
 */
export interface ILimiter {
  canProceed(): Promise<boolean>;
  recordJobStart(): Promise<void>;
  recordJobCompletion(): Promise<void>;
  getNextAvailableTime(): Promise<Date>;
  setNextAvailableTime(date: Date): Promise<void>;
  clear(): Promise<void>;
}

export interface RateLimiterOptions {
  readonly maxExecutions: number;
  readonly windowSizeInSeconds: number;
}

export interface RateLimiterWithBackoffOptions extends RateLimiterOptions {
  readonly initialBackoffDelay?: number;
  readonly backoffMultiplier?: number;
  readonly maxBackoffDelay?: number;
}
