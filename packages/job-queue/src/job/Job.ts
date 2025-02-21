//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { JobQueue } from "./JobQueue";
import type { JobProgressListener } from "./JobQueueEventListeners";

export enum JobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ABORTING = "ABORTING",
  FAILED = "FAILED",
}

/**
 * Details about a job that reflect the structure in the database.
 */
export type JobConstructorParam<Input, Output> = {
  id?: unknown;
  jobRunId?: string;
  queueName?: string;
  input: Input;
  output?: Output | null;
  error?: string | null;
  errorCode?: string | null;
  fingerprint?: string;
  maxRetries?: number;
  status?: JobStatus;
  createdAt?: Date;
  deadlineAt?: Date | null;
  lastRanAt?: Date | null;
  runAfter?: Date | null;
  completedAt?: Date | null;
  retries?: number;
  progress?: number;
  progressMessage?: string;
  progressDetails?: Record<string, any> | null;
};

/**
 * A job that can be executed by a JobQueue.
 *
 * @template Input - The type of the job's input
 * @template Output - The type of the job's output
 */
export class Job<Input, Output> {
  public id: unknown;
  public jobRunId: string | undefined;
  public queueName: string | undefined;
  public input: Input;
  public maxRetries: number;
  public createdAt: Date;
  public fingerprint: string | undefined;
  public status: JobStatus = JobStatus.PENDING;
  public runAfter: Date;
  public output: Output | null = null;
  public retries: number = 0;
  public lastRanAt: Date | null = null;
  public completedAt: Date | null = null;
  public deadlineAt: Date | null = null;
  public error: string | null = null;
  public errorCode: string | null = null;
  public progress: number = 0;
  public progressMessage: string = "";
  public progressDetails: Record<string, any> | null = null;
  public queue: JobQueue<Input, Output> | undefined;

  constructor({
    queueName,
    input,
    jobRunId,
    id,
    error = null,
    fingerprint = undefined,
    output = null,
    maxRetries = 10,
    createdAt = new Date(),
    completedAt = null,
    status = JobStatus.PENDING,
    deadlineAt = null,
    retries = 0,
    lastRanAt = null,
    runAfter = new Date(),
    progress = 0,
    progressMessage = "",
    progressDetails = null,
  }: JobConstructorParam<Input, Output>) {
    this.runAfter = runAfter ?? new Date();
    this.createdAt = createdAt ?? new Date();
    this.lastRanAt = lastRanAt ?? null;
    this.deadlineAt = deadlineAt ?? null;
    this.completedAt = completedAt ?? null;

    this.queueName = queueName;
    this.id = id;
    this.jobRunId = jobRunId;
    this.status = status;
    this.fingerprint = fingerprint;
    this.input = input;
    this.maxRetries = maxRetries;
    this.retries = retries;
    this.output = output;
    this.error = error;
    this.progress = progress;
    this.progressMessage = progressMessage;
    this.progressDetails = progressDetails;
  }
  async execute(signal: AbortSignal): Promise<Output> {
    throw new Error("Method not implemented.");
  }

  private progressListeners: Set<JobProgressListener> = new Set();

  /**
   * Update the job's progress
   * @param progress - Progress value between 0 and 100
   * @param message - Optional progress message
   * @param details - Optional progress details
   */
  public async updateProgress(
    progress: number,
    message: string = "",
    details: Record<string, any> | null = null
  ) {
    this.progress = progress;
    this.progressMessage = message;
    this.progressDetails = details;

    // Notify direct listeners
    for (const listener of this.progressListeners) {
      listener(progress, message, details);
    }

    await this.queue?.updateProgress(this.id, progress, message, details);
  }

  /**
   * Adds a progress listener for this job
   *
   * Only used if run directly (not via a queue)
   *
   * @param listener - The callback function to be called when progress updates occur
   * @returns A cleanup function to remove the listener
   */
  public onJobProgress(listener: JobProgressListener): () => void {
    this.progressListeners.add(listener);

    return () => {
      this.progressListeners.delete(listener);
    };
  }
}
