/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServiceToken, globalServiceRegistry } from "../di";

export class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private readyWorkers: Map<string, Promise<void>> = new Map();

  registerWorker(name: string, worker: Worker) {
    if (this.workers.has(name)) throw new Error(`Worker ${name} is already registered.`);
    this.workers.set(name, worker);

    this.workers.set(name, worker);
    worker.addEventListener("error", (event) => {
      console.error("Worker Error:", event.message, "at", event.filename, "line:", event.lineno);
    });
    worker.addEventListener("messageerror", (event) => {
      console.error("Worker message error:", event);
    });

    const readyPromise = new Promise<void>((resolve) => {
      const handleReady = (event: MessageEvent) => {
        if (event.data?.type === "ready") {
          worker.removeEventListener("message", handleReady);
          resolve();
        }
      };

      worker.addEventListener("message", handleReady);
    });

    this.readyWorkers.set(name, readyPromise);
  }

  getWorker(name: string): Worker {
    const worker = this.workers.get(name);
    if (!worker) throw new Error(`Worker ${name} not found.`);
    return worker;
  }

  async callWorkerFunction<T>(
    workerName: string,
    functionName: string,
    args: any[],
    options?: {
      signal?: AbortSignal;
      onProgress?: (progress: number, message?: string, details?: any) => void;
    }
  ): Promise<T> {
    const worker = this.workers.get(workerName);
    if (!worker) throw new Error(`Worker ${workerName} not found.`);
    await this.readyWorkers.get(workerName);

    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();

      const handleMessage = (event: MessageEvent) => {
        const { id, type, data } = event.data;
        if (id !== requestId) return;
        if (type === "progress" && options?.onProgress) {
          options.onProgress(data.progress, data.message, data.details);
        } else if (type === "complete") {
          cleanup();
          resolve(data);
        } else if (type === "error") {
          cleanup();
          reject(new Error(data));
        }
      };

      const handleAbort = () => {
        worker.postMessage({ id: requestId, type: "abort" });
      };

      const cleanup = () => {
        worker.removeEventListener("message", handleMessage);
        options?.signal?.removeEventListener("abort", handleAbort);
      };

      worker.addEventListener("message", handleMessage);

      if (options?.signal) {
        options.signal.addEventListener("abort", handleAbort, { once: true });
      }

      worker.postMessage({ id: requestId, type: "call", functionName, args });
    });
  }
}

export const WORKER_MANAGER = createServiceToken<WorkerManager>("worker.manager");

globalServiceRegistry.register(WORKER_MANAGER, () => new WorkerManager(), true);
