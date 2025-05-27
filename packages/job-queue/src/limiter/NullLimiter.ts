//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { ILimiter } from "./ILimiter";
import { createServiceToken } from "@podley/util";

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
