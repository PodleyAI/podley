/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken } from "@podley/util";
import { ILimiter } from "./ILimiter";

export const NULL_JOB_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter.null");

/**
 * Null limiter that does nothing.
 */
export class NullLimiter implements ILimiter {
  async canProceed(): Promise<boolean> {
    return true;
  }

  async recordJobStart(): Promise<void> {
    // Do nothing
  }

  async recordJobCompletion(): Promise<void> {
    // Do nothing
  }

  async getNextAvailableTime(): Promise<Date> {
    return new Date();
  }

  async setNextAvailableTime(date: Date): Promise<void> {
    // Do nothing
  }

  async clear(): Promise<void> {
    // Do nothing
  }
}
