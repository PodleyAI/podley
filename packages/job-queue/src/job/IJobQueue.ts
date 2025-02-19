//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { Job, JobStatus } from "./Job";
import { JobError, JobQueueStats, JobProgressListener, QueueMode } from "./JobQueue";

export interface IJobQueue<Input, Output> {
  queueName: string;
  add(job: Job<Input, Output>): Promise<unknown>;
  get(id: unknown): Promise<Job<Input, Output> | undefined>;
  waitFor(jobId: unknown): Promise<Output>;
  abort(jobId: unknown): Promise<boolean>;

  peek(status?: JobStatus, num?: number): Promise<Job<Input, Output>[]>;
  size(status?: JobStatus): Promise<number>;

  complete(id: unknown, output?: Output, error?: JobError): Promise<void>;
  outputForInput(input: Input): Promise<Output | null>;

  getJobsByRunId(jobRunId: string): Promise<Job<Input, Output>[]>;
  getStats(): JobQueueStats;

  updateProgress(
    jobId: unknown,
    progress: number,
    message?: string,
    details?: Record<string, any> | null
  ): Promise<void>;
  onJobProgress(jobId: unknown, listener: JobProgressListener): () => void;
  removeAllJobProgressListeners(jobId: unknown): void;

  start(mode?: QueueMode): Promise<this>;
  stop(): Promise<this>;
  clear(): Promise<this>;
  restart(): Promise<this>;

  next(): Promise<Job<Input, Output> | undefined>;
}
