/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, makeFingerprint, uuid4 } from "@workglow/util";
import {
  ensureIndexedDbTable,
  ExpectedIndexDefinition,
  MigrationOptions,
} from "../util/IndexedDbTable";
import {
  IQueueStorage,
  JobStatus,
  JobStorageFormat,
  PrefixColumn,
  QueueStorageOptions,
} from "./IQueueStorage";

export const INDEXED_DB_QUEUE_STORAGE = createServiceToken<IQueueStorage<any, any>>(
  "jobqueue.storage.indexedDb"
);

/**
 * Extended options for IndexedDB queue storage including prefix support
 */
export interface IndexedDbQueueStorageOptions extends QueueStorageOptions, MigrationOptions {}

/**
 * IndexedDB implementation of a job queue storage.
 * Provides storage and retrieval for job execution states using IndexedDB.
 */
export class IndexedDbQueueStorage<Input, Output> implements IQueueStorage<Input, Output> {
  private db: IDBDatabase | undefined;
  private readonly tableName: string;
  private readonly migrationOptions: MigrationOptions;
  /** The prefix column definitions */
  protected readonly prefixes: readonly PrefixColumn[];
  /** The prefix values for filtering */
  protected readonly prefixValues: Readonly<Record<string, string | number>>;

  constructor(
    public readonly queueName: string,
    options: IndexedDbQueueStorageOptions = {}
  ) {
    this.migrationOptions = options;
    this.prefixes = options.prefixes ?? [];
    this.prefixValues = options.prefixValues ?? {};
    // Generate table name based on prefix configuration to avoid conflicts
    if (this.prefixes.length > 0) {
      const prefixNames = this.prefixes.map((p) => p.name).join("_");
      this.tableName = `jobs_${prefixNames}`;
    } else {
      this.tableName = "jobs";
    }
  }

  /**
   * Gets prefix column names for use in indexes
   */
  private getPrefixColumnNames(): string[] {
    return this.prefixes.map((p) => p.name);
  }

  /**
   * Checks if a job matches the current prefix values
   */
  private matchesPrefixes(job: JobStorageFormat<Input, Output> & Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(this.prefixValues)) {
      if (job[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Gets prefix values as an array in column order for index key construction
   */
  private getPrefixKeyValues(): Array<string | number> {
    return this.prefixes.map((p) => this.prefixValues[p.name]);
  }

  private async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    await this.setupDatabase();
    return this.db!;
  }

  /**
   * Sets up the IndexedDB database table with the required schema and indexes.
   * Must be called before using any other methods.
   */
  public async setupDatabase(): Promise<void> {
    const prefixColumnNames = this.getPrefixColumnNames();

    // Build index key paths with prefixes prepended
    const buildKeyPath = (basePath: string[]): string[] => {
      return [...prefixColumnNames, ...basePath];
    };

    const expectedIndexes: ExpectedIndexDefinition[] = [
      {
        name: "queue_status",
        keyPath: buildKeyPath(["queue", "status"]),
        options: { unique: false },
      },
      {
        name: "queue_status_run_after",
        keyPath: buildKeyPath(["queue", "status", "run_after"]),
        options: { unique: false },
      },
      {
        name: "queue_job_run_id",
        keyPath: buildKeyPath(["queue", "job_run_id"]),
        options: { unique: false },
      },
      {
        name: "queue_fingerprint_status",
        keyPath: buildKeyPath(["queue", "fingerprint", "status"]),
        options: { unique: false },
      },
    ];

    // Now initialize the database
    this.db = await ensureIndexedDbTable(
      this.tableName,
      "id",
      expectedIndexes,
      this.migrationOptions
    );
  }

  /**
   * Adds a job to the queue.
   * @param job - The job to add to the queue.
   * @returns A promise that resolves to the job id.
   */
  public async add(job: JobStorageFormat<Input, Output>): Promise<unknown> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const jobWithPrefixes = job as JobStorageFormat<Input, Output> & Record<string, unknown>;
    jobWithPrefixes.id = jobWithPrefixes.id ?? uuid4();
    jobWithPrefixes.job_run_id = jobWithPrefixes.job_run_id ?? uuid4();
    jobWithPrefixes.queue = this.queueName;
    jobWithPrefixes.fingerprint = await makeFingerprint(jobWithPrefixes.input);
    jobWithPrefixes.status = JobStatus.PENDING;
    jobWithPrefixes.progress = 0;
    jobWithPrefixes.progress_message = "";
    jobWithPrefixes.progress_details = null;
    jobWithPrefixes.created_at = now;
    jobWithPrefixes.run_after = now;

    // Add prefix values to the job
    for (const [key, value] of Object.entries(this.prefixValues)) {
      jobWithPrefixes[key] = value;
    }

    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);

    return new Promise((resolve, reject) => {
      const request = store.add(jobWithPrefixes);

      // Don't resolve until transaction is complete
      tx.oncomplete = () => resolve(jobWithPrefixes.id);
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
    const db = await this.getDb();
    const tx = db.transaction(this.tableName, "readonly");
    const store = tx.objectStore(this.tableName);
    const request = store.get(id as string);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const job = request.result as
          | (JobStorageFormat<Input, Output> & Record<string, unknown>)
          | undefined;
        // Filter by queue name and prefix values to ensure job belongs to this queue
        if (job && job.queue === this.queueName && this.matchesPrefixes(job)) {
          resolve(job);
        } else {
          resolve(undefined);
        }
      };
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
    const db = await this.getDb();
    const tx = db.transaction(this.tableName, "readonly");
    const store = tx.objectStore(this.tableName);
    const index = store.index("queue_status_run_after");
    const prefixKeyValues = this.getPrefixKeyValues();

    return new Promise((resolve, reject) => {
      const ret = new Map<unknown, JobStorageFormat<Input, Output>>();
      // Create a key range for the compound index: from [prefixes..., queue, status, ""] to [prefixes..., queue, status, "\uffff"]
      const keyRange = IDBKeyRange.bound(
        [...prefixKeyValues, this.queueName, status, ""],
        [...prefixKeyValues, this.queueName, status, "\uffff"]
      );
      const cursorRequest = index.openCursor(keyRange);

      const handleCursor = (e: Event) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor || ret.size >= num) {
          resolve(Array.from(ret.values()));
          return;
        }
        const job = cursor.value as JobStorageFormat<Input, Output> & Record<string, unknown>;
        // Verify prefix match and use Map to ensure no duplicates by job ID
        if (this.matchesPrefixes(job)) {
          ret.set(cursor.value.id, cursor.value);
        }
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
    const db = await this.getDb();
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    const index = store.index("queue_status_run_after");
    const now = new Date().toISOString();
    const prefixKeyValues = this.getPrefixKeyValues();

    return new Promise((resolve, reject) => {
      const cursorRequest = index.openCursor(
        IDBKeyRange.bound(
          [...prefixKeyValues, this.queueName, JobStatus.PENDING, ""],
          [...prefixKeyValues, this.queueName, JobStatus.PENDING, now],
          false,
          true
        )
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

        const job = cursor.value as JobStorageFormat<Input, Output> & Record<string, unknown>;
        // Verify the job belongs to this queue, matches prefixes, and is still in PENDING state
        if (
          job.queue !== this.queueName ||
          job.status !== JobStatus.PENDING ||
          !this.matchesPrefixes(job)
        ) {
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
    const db = await this.getDb();
    const prefixKeyValues = this.getPrefixKeyValues();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.tableName, "readonly");
      const store = tx.objectStore(this.tableName);
      const index = store.index("queue_status");
      const keyRange = IDBKeyRange.only([...prefixKeyValues, this.queueName, status]);
      const request = index.count(keyRange);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Marks a job as complete with its output or error.
   */
  public async complete(job: JobStorageFormat<Input, Output>): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);

    return new Promise((resolve, reject) => {
      const getReq = store.get(job.id as string);
      getReq.onsuccess = () => {
        const existing = getReq.result as
          | (JobStorageFormat<Input, Output> & Record<string, unknown>)
          | undefined;
        // Verify job belongs to this queue and matches prefixes
        if (!existing || existing.queue !== this.queueName || !this.matchesPrefixes(existing)) {
          reject(
            new Error(`Job ${job.id} not found or does not belong to queue ${this.queueName}`)
          );
          return;
        }
        const currentAttempts = existing.run_attempts ?? 0;
        job.run_attempts = currentAttempts + 1;
        // Ensure queue is set correctly
        job.queue = this.queueName;

        // Ensure prefix values are preserved
        const jobWithPrefixes = job as JobStorageFormat<Input, Output> & Record<string, unknown>;
        for (const [key, value] of Object.entries(this.prefixValues)) {
          jobWithPrefixes[key] = value;
        }

        const putReq = store.put(jobWithPrefixes);
        putReq.onsuccess = () => {};
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);

      // Don't resolve until transaction is complete
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
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
    const db = await this.getDb();
    const tx = db.transaction(this.tableName, "readonly");
    const store = tx.objectStore(this.tableName);
    const index = store.index("queue_job_run_id");
    const prefixKeyValues = this.getPrefixKeyValues();
    const keyRange = IDBKeyRange.only([...prefixKeyValues, this.queueName, job_run_id]);
    const request = index.getAll(keyRange);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // Filter results to ensure they match prefixes
        const results = (request.result || []).filter(
          (job: JobStorageFormat<Input, Output> & Record<string, unknown>) =>
            this.matchesPrefixes(job)
        );
        resolve(results);
      };
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Deletes all jobs from the queue.
   */
  public async deleteAll(): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    const index = store.index("queue_status");
    const prefixKeyValues = this.getPrefixKeyValues();

    return new Promise((resolve, reject) => {
      // Use a cursor to iterate through all jobs for this queue with prefix
      const keyRange = IDBKeyRange.bound(
        [...prefixKeyValues, this.queueName, ""],
        [...prefixKeyValues, this.queueName, "\uffff"]
      );
      const request = index.openCursor(keyRange);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const job = cursor.value as JobStorageFormat<Input, Output> & Record<string, unknown>;
          // Verify job belongs to this queue and matches prefixes before deleting
          if (job.queue === this.queueName && this.matchesPrefixes(job)) {
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

  /**
   * Gets the output for a given input.
   */
  public async outputForInput(input: Input): Promise<Output | null> {
    const fingerprint = await makeFingerprint(input);
    const db = await this.getDb();
    const tx = db.transaction(this.tableName, "readonly");
    const store = tx.objectStore(this.tableName);
    const index = store.index("queue_fingerprint_status");
    const prefixKeyValues = this.getPrefixKeyValues();
    const request = index.get([
      ...prefixKeyValues,
      this.queueName,
      fingerprint,
      JobStatus.COMPLETED,
    ]);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const job = request.result as
          | (JobStorageFormat<Input, Output> & Record<string, unknown>)
          | undefined;
        if (job && this.matchesPrefixes(job)) {
          resolve(job.output ?? null);
        } else {
          resolve(null);
        }
      };
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
    const job = await this.get(id);
    if (!job) return;

    const db = await this.getDb();
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
    const db = await this.getDb();
    const tx = db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    const index = store.index("queue_status");
    const cutoffDate = new Date(Date.now() - olderThanMs).toISOString();
    const prefixKeyValues = this.getPrefixKeyValues();
    const keyRange = IDBKeyRange.only([...prefixKeyValues, this.queueName, status]);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(keyRange);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const job = cursor.value as JobStorageFormat<Input, Output> & Record<string, unknown>;
          // Verify job belongs to this queue, matches prefixes, and matches criteria
          if (
            job.queue === this.queueName &&
            this.matchesPrefixes(job) &&
            job.status === status &&
            job.completed_at &&
            job.completed_at <= cutoffDate
          ) {
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
