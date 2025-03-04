//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { createServiceToken } from "@ellmers/util";
import { ILimiter } from "../job/ILimiter";
import { IJobQueue } from "../job/IJobQueue";

export const JOB_QUEUE = createServiceToken<IJobQueue<any, any>>("jobqueue.jobQueue");
export const JOB_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter");
export const JOB_RATE_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter.rate");

// Job Queue Actual Implementations
export const MEMORY_JOB_QUEUE = createServiceToken<IJobQueue<any, any>>("jobqueue.jobQueue.memory");
export const IDB_JOB_QUEUE = createServiceToken<IJobQueue<any, any>>("jobqueue.jobQueue.indexedDb");
export const POSTGRES_JOB_QUEUE = createServiceToken<IJobQueue<any, any>>(
  "jobqueue.jobQueue.postgres"
);
export const SQLITE_JOB_QUEUE = createServiceToken<IJobQueue<any, any>>("jobqueue.jobQueue.sqlite");

// Job Rate Limiter Actual Implementations
export const MEMORY_JOB_RATE_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter.rate.memory");
export const POSTGRES_JOB_RATE_LIMITER = createServiceToken<ILimiter>(
  "jobqueue.limiter.rate.postgres"
);
export const SQLITE_JOB_RATE_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter.rate.sqlite");

// Job Limiter Actual Implementations
export const CONCURRENT_JOB_LIMITER = createServiceToken<ILimiter>("jobqueue.limiter.concurrent");
