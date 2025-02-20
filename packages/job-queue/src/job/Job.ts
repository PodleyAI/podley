//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import type { JobProgressListener, JobQueue } from "./JobQueue";

export enum JobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ABORTING = "ABORTING",
  FAILED = "FAILED",
}

// ===============================================================================

export interface JobDetails<Input, Output> {
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
  createdAt?: Date | string;
  deadlineAt?: Date | string | null;
  lastRanAt?: Date | string | null;
  runAfter?: Date | string | null;
  completedAt?: Date | string | null;
  retries?: number;
  progress?: number;
  progressMessage?: string;
  progressDetails?: Record<string, any> | null;
}

export class Job<Input, Output> implements JobDetails<Input, Output> {
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
    runAfter = null,
    progress = 0,
    progressMessage = "",
    progressDetails = null,
  }: JobDetails<Input, Output>) {
    if (typeof runAfter === "string") runAfter = new Date(runAfter);
    if (typeof lastRanAt === "string") lastRanAt = new Date(lastRanAt);
    if (typeof createdAt === "string") createdAt = new Date(createdAt);
    if (typeof deadlineAt === "string") deadlineAt = new Date(deadlineAt);
    if (typeof completedAt === "string") completedAt = new Date(completedAt);

    this.id = id;
    this.fingerprint = fingerprint;
    this.queueName = queueName;
    this.input = input;
    this.maxRetries = maxRetries;
    this.createdAt = createdAt ?? new Date();
    this.runAfter = runAfter ?? createdAt ?? new Date();
    this.status = status;
    this.deadlineAt = deadlineAt;
    this.retries = retries;
    this.lastRanAt = lastRanAt;
    this.completedAt = completedAt;
    this.output = output;
    this.error = error;
    this.jobRunId = jobRunId;
    this.progress = progress;
    this.progressMessage = progressMessage;
    this.progressDetails = progressDetails;
  }
  async execute(signal: AbortSignal): Promise<Output> {
    throw new Error("Method not implemented.");
  }

  private progressListeners: Set<JobProgressListener> = new Set();

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
