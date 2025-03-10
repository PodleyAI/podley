//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@ellmers/util";

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
