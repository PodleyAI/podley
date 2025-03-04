//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { serviceRegistry } from "@ellmers/util";
import { JOB_QUEUE, JOB_LIMITER } from "./diTokens";

/**
 * Get the registered job limiter
 */
export function getJobLimiter(): typeof JOB_LIMITER._type {
  return serviceRegistry.get(JOB_LIMITER);
}

/**
 * Get the registered job queue
 */
export function getJobQueue(): typeof JOB_QUEUE._type {
  return serviceRegistry.get(JOB_QUEUE);
}

/**
 * Register a custom job limiter
 */
export function registerJobLimiter(limiter: typeof JOB_LIMITER._type): void {
  serviceRegistry.registerInstance(JOB_LIMITER, limiter);
}

/**
 * Register a custom job queue
 */
export function registerJobQueue(queue: typeof JOB_QUEUE._type): void {
  serviceRegistry.registerInstance(JOB_QUEUE, queue);
}
