/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { parentPort } from "@workglow/util";
import { createServiceToken, globalServiceRegistry } from "../di";

/**
 * Extracts transferables from an object.
 * @param obj - The object to extract transferables from.
 * @returns An array of transferables.
 */
function extractTransferables(obj: any) {
  const transferables: Transferable[] = [];

  function findTransferables(value: any) {
    if (value instanceof Float32Array || value instanceof Int16Array) {
      transferables.push(value.buffer);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(findTransferables);
    }
  }

  findTransferables(obj);
  return transferables;
}

/**
 * WorkerServer is a class that handles messages from the main thread to the worker.
 * It is used to register functions that can be called from the main thread.
 * It also handles the transfer of transferables to the main thread.
 */
export class WorkerServer {
  constructor() {
    parentPort?.addEventListener("message", async (event) => {
      const msg = {
        type: event.type,
        // @ts-ignore - Ignore type mismatch between standard MessageEvent and our message type
        data: event.data,
      };
      await this.handleMessage(msg);
    });
  }

  private functions: Record<string, (...args: any[]) => Promise<any>> = {};

  // Keep track of each request's AbortController
  private requestControllers = new Map<string, AbortController>();
  // Keep track of requests that have already been responded to
  private completedRequests = new Set<string>();

  private postResult = (id: string, result: any) => {
    if (this.completedRequests.has(id)) {
      return; // Already responded to this request
    }
    this.completedRequests.add(id);
    const transferables = extractTransferables(result);
    // @ts-ignore - Ignore type mismatch between standard Transferable and Bun.Transferable
    postMessage({ id, type: "complete", data: result }, transferables);
  };

  private postError = (id: string, errorMessage: string) => {
    if (this.completedRequests.has(id)) {
      return; // Already responded to this request
    }
    this.completedRequests.add(id);
    postMessage({ id, type: "error", data: errorMessage });
  };

  registerFunction(name: string, fn: (...args: any[]) => Promise<any>) {
    this.functions[name] = fn;
  }

  // Handle messages from the main thread
  async handleMessage(event: { type: string; data: any }) {
    const { id, type, functionName, args } = event.data;
    if (type === "abort") {
      return await this.handleAbort(id);
    }
    if (type === "call") {
      return await this.handleCall(id, functionName, args);
    }
  }

  async handleAbort(id: string) {
    if (this.requestControllers.has(id)) {
      const controller = this.requestControllers.get(id);
      controller?.abort();
      this.requestControllers.delete(id);
      // Send error response back to main thread so the promise rejects
      this.postError(id, "Operation aborted");
    }
  }

  async handleCall(id: string, functionName: string, [input, model]: [any, any]) {
    if (!(functionName in this.functions)) {
      this.postError(id, `Function ${functionName} not found`);
      return;
    }

    try {
      const abortController = new AbortController();
      this.requestControllers.set(id, abortController);

      const fn = this.functions[functionName];
      const postProgress = (progress: number, message?: string, details?: any) => {
        // Don't send progress updates after the request is completed/aborted
        if (!this.completedRequests.has(id)) {
          postMessage({ id, type: "progress", data: { progress, message, details } });
        }
      };
      const result = await fn(input, model, postProgress, abortController.signal);
      this.postResult(id, result);
    } catch (error: any) {
      this.postError(id, error.message);
    } finally {
      this.requestControllers.delete(id);
      // Clean up completed requests set after a delay to handle any race conditions
      // where abort message might arrive shortly after completion
      setTimeout(() => {
        this.completedRequests.delete(id);
      }, 1000);
    }
  }
}

export const WORKER_SERVER = createServiceToken<WorkerServer>("worker.server");

globalServiceRegistry.register(WORKER_SERVER, () => new WorkerServer(), true);
