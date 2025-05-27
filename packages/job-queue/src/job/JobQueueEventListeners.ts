//    *******************************************************************************
//    *   PODLEY.AI: Your Agentic AI library                                        *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { EventParameters } from "@podley/util";
import { JobQueueStats } from "./JobQueue";

/**
 * Events that can be emitted by the JobQueue
 */
export type JobQueueEventListeners<Input, Output> = {
  queue_start: (queueName: string) => void;
  queue_stop: (queueName: string) => void;
  job_start: (queueName: string, jobId: unknown) => void;
  job_aborting: (queueName: string, jobId: unknown) => void;
  job_complete: (queueName: string, jobId: unknown, output: Output) => void;
  job_error: (queueName: string, jobId: unknown, error: string) => void;
  job_skipped: (queueName: string, jobId: unknown) => void;
  job_retry: (queueName: string, jobId: unknown, runAfter: Date) => void;
  queue_stats_update: (queueName: string, stats: JobQueueStats) => void;
  job_progress: (
    queueName: string,
    jobId: unknown,
    progress: number,
    message: string,
    details: Record<string, any> | null
  ) => void;
};

export type JobQueueEvents = keyof JobQueueEventListeners<any, any>;

export type JobQueueEventListener<Event extends JobQueueEvents> = JobQueueEventListeners<
  any,
  any
>[Event];

export type JobQueueEventParameters<Event extends JobQueueEvents, Input, Output> = EventParameters<
  JobQueueEventListeners<Input, Output>,
  Event
>;
/**
 * Type for progress event listener callback
 */
export type JobProgressListener = (
  progress: number,
  message: string,
  details: Record<string, any> | null
) => void;
