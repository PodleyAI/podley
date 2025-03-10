//    *******************************************************************************
//    *   ELLMERS: Embedding Large Language Model Experiential Retrieval Service    *
//    *                                                                             *
//    *   Copyright Steven Roussey <sroussey@gmail.com>                             *
//    *   Licensed under the Apache License, Version 2.0 (the "License");           *
//    *******************************************************************************

import { uuid4 } from "@ellmers/util";
import { makeFingerprint } from "@ellmers/util";
import { JobStatus, JobStorageFormat, IQueueStorage } from "./IQueueStorage";
import { ensureIndexedDbTable, ExpectedIndexDefinition } from "../util/IndexedDbTable";
import { createServiceToken } from "@ellmers/util";

export const INDEXED_DB_QUEUE_STORAGE = createServiceToken<IQueueStorage<any, any>>(
  "storage.queueStorage.indexedDb"
);

/**
 * IndexedDB implementation of a job queue storage.
 * Provides storage and retrieval for job execution states using IndexedDB.
 */
export class IndexedDbQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  private dbPromise: Promise<IDBDatabase>;
  private tableName: string;

  constructor(public readonly queueName: string) {
    this.tableName = `jobs_${queueName}`;

    const expectedIndexes: ExpectedIndexDefinition[] = [
      {
        name: "status",
        keyPath: `status`,
        options: { unique: false },
      },
      {
        name: "status_run_after",
        keyPath: ["status", "run_after"],
        options: { unique: false },
      },
      {
        name: "job_run_id",
        keyPath: `job_run_id`,
        options: { unique: false },
      },
      {
        name: "fingerprint_status",
        keyPath: ["fingerprint", "status"],
        options: { unique: false },
      },
    ];

    // Now initialize the database
    this.dbPromise = ensureIndexedDbTable(this.tableName, "id", expectedIndexes);
  }

  /**
   * Adds a job to the queue.
   * @param job - The job to add to the queue.
   * @returns A promise that resolves to the job id.
   */
  public async add(job: JobStorageFormat<Input, Output>): Promise<unknown> {
    const now = new Date().toISOString();
    job.id = job.id ?? uuid4();
    job.job_run_id = job.job_run_id ?? uuid4();
    job.queue = this.queueName;
    job.fingerprint = await makeFingerprint(job.input);
    job.status = JobStatus.PENDING;
    job.progress = 0;
    job.progress_message = "";
    job.progress_details = null;
    job.created_at = now;
    job.run_after = now;

    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);

    return new Promise((resolve, reject) => {
      const request = store.add(job);

      // Don't resolve until transaction is complete
      tx.oncomplete = () => resolve(job.id);
      tx.onerror = () => reject(tx.error);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves a job from the queue by its id.
   * @param id - The id of the job to retrieve.
   * @returns A promise that resolves to the job or undefined if the job is not found.
   */
  async get(id: unknown): Promise<JobStorageFormat<Input, Output> | undefined> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readonly");
    const store = tx.objectStore(this.tableName);
    const request = store.get(id as string);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieves a slice of jobs from the queue.
   * @param status - The status of the jobs to retrieve.
   * @param num - The number of jobs to retrieve.
   * @returns A promise that resolves to an array of jobs.
   */
  public async peek(
    status: JobStatus = JobStatus.PENDING,
    num: number = 100
  ): Promise<JobStorageFormat<Input, Output>[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readonly");
    const store = tx.objectStore(this.tableName);
    const index = store.index("status_run_after");

    return new Promise((resolve, reject) => {
      const ret = new Map<unknown, JobStorageFormat<Input, Output>>();
      // Create a key range for the compound index: from [status, ""] to [status, "\uffff"]
      const keyRange = IDBKeyRange.bound([status, ""], [status, "\uffff"]);
      const cursorRequest = index.openCursor(keyRange);

      const handleCursor = (e: Event) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor || ret.size >= num) {
          resolve(Array.from(ret.values()));
          return;
        }
        // Use Map to ensure no duplicates by job ID
        ret.set(cursor.value.id, cursor.value);
        cursor.continue();
      };

      cursorRequest.onsuccess = handleCursor;
      cursorRequest.onerror = () => reject(cursorRequest.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieves the next job from the queue.
   * @returns A promise that resolves to the next job or undefined if the queue is empty.
   */
  public async next(): Promise<JobStorageFormat<Input, Output> | undefined> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    const index = store.index("status_run_after");
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const cursorRequest = index.openCursor(
        IDBKeyRange.bound([JobStatus.PENDING, ""], [JobStatus.PENDING, now], false, true)
      );

      let jobToReturn: JobStorageFormat<Input, Output> | undefined;

      cursorRequest.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          if (jobToReturn) {
            resolve(jobToReturn);
          } else {
            resolve(undefined);
          }
          return;
        }

        const job = cursor.value;
        // Verify the job is still in PENDING state
        if (job.status !== JobStatus.PENDING) {
          cursor.continue();
          return;
        }

        job.status = JobStatus.PROCESSING;
        job.last_ran_at = now;

        try {
          const updateRequest = store.put(job);
          updateRequest.onsuccess = () => {
            jobToReturn = job;
            // Don't resolve here - wait for transaction to complete
          };
          updateRequest.onerror = (err) => {
            console.error("Failed to update job status:", err);
            cursor.continue();
          };
        } catch (err) {
          console.error("Error updating job:", err);
          cursor.continue();
        }
      };

      cursorRequest.onerror = () => reject(cursorRequest.error);

      // Wait for transaction to complete before resolving
      tx.oncomplete = () => {
        resolve(jobToReturn);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieves the number of jobs in the queue.
   * Returns the count of jobs in the queue.
   */
  public async size(status = JobStatus.PENDING): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.tableName, "readonly");
      const store = tx.objectStore(this.tableName);
      const index = store.index("status");
      const request = index.count(status);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Marks a job as complete with its output or error.
   */
  public async complete(job: JobStorageFormat<Input, Output>): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);

    return new Promise((resolve, reject) => {
      job.run_attempts = job.run_attempts || 1;
      const request = store.put(job);

      // Don't resolve until transaction is complete
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Aborts a job in the queue.
   */
  public async abort(id: unknown): Promise<void> {
    const job = await this.get(id);
    if (!job) return;

    job.status = JobStatus.ABORTING;
    await this.complete(job);
  }

  /**
   * Gets jobs by their run ID.
   */
  public async getByRunId(job_run_id: string): Promise<JobStorageFormat<Input, Output>[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readonly");
    const store = tx.objectStore(this.tableName);
    const index = store.index("job_run_id");
    const request = index.getAll(job_run_id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Deletes all jobs from the queue.
   */
  public async deleteAll(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Gets the output for a given input.
   */
  public async outputForInput(input: Input): Promise<Output | null> {
    const fingerprint = await makeFingerprint(input);
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readonly");
    const store = tx.objectStore(this.tableName);
    const index = store.index("fingerprint_status");
    const request = index.get([fingerprint, JobStatus.COMPLETED]);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.output ?? null);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Saves progress updates for a job.
   */
  public async saveProgress(
    id: unknown,
    progress: number,
    message: string,
    details: Record<string, any> | null
  ): Promise<void> {
    const job = await this.get(id);
    if (!job) throw new Error(`Job ${id} not found`);

    job.progress = progress;
    job.progress_message = message;
    job.progress_details = details;

    await this.complete(job);
  }

  /**
   * Deletes a job by its ID.
   */
  public async delete(id: unknown): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    const request = store.delete(id as string);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete jobs with a specific status older than a cutoff date
   * @param status - Status of jobs to delete
   * @param olderThanMs - Delete jobs completed more than this many milliseconds ago
   */
  public async deleteJobsByStatusAndAge(status: JobStatus, olderThanMs: number): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    const index = store.index("status");
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();

    return new Promise((resolve, reject) => {
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const job = cursor.value;
          if (job.status === status && job.completed_at && job.completed_at <= cutoffDate) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      request.onerror = () => reject(request.error);
    });
  }
}
